/* ============================================
   Face Detection — Camera, Face, Eye & Emotion
   ============================================ */
const FaceDetection = (() => {
  let videoEl = null, canvas = null, ctx = null, stream = null, detector = null;
  let interval = null, isActive = false, faceDetected = false;
  let eyeStatus = 'tracking';
  let noFaceStart = null, lookAwayStart = null;
  let onViolationCb = null, onStatusCb = null, onEmotionCb = null;
  let motionHistory = [], blinkHistory = [], gazeHistory = [];
  let prevFrame = null, prevFaceBB = null;

  const NO_FACE_WARN = 2000, NO_FACE_VIOL = 5000, LOOK_AWAY_WARN = 3000;
  const DETECT_MS = 400;

  // Emotion/nervousness state
  let emotionState = {
    confidence: 70, nervousness: 20, engagement: 80, stress: 15,
    emotion: 'neutral', blinkRate: 0, headMovement: 0, gazeStability: 90
  };

  async function init(sel) {
    const container = document.querySelector(sel);
    if (!container) return false;
    videoEl = document.createElement('video');
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.muted = true;
    videoEl.style.cssText = 'width:100%;height:100%;object-fit:cover;transform:scaleX(-1)';
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none';
    ctx = canvas.getContext('2d');
    container.innerHTML = '';
    container.appendChild(videoEl);
    container.appendChild(canvas);
    if ('FaceDetector' in window) {
      try { detector = new FaceDetector({fastMode:true}); } catch(e) { detector = null; }
    }
    return true;
  }

  async function startCamera() {
    try {
      // Stop existing tracks if any
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, frameRate: { ideal: 30 } }, 
        audio: false 
      });
      
      videoEl.srcObject = stream; 
      
      // Force play
      return new Promise((resolve) => {
        videoEl.onloadedmetadata = () => {
          videoEl.play()
            .then(() => {
              canvas.width = videoEl.videoWidth || 640; 
              canvas.height = videoEl.videoHeight || 480;
              resolve(true);
            })
            .catch(err => {
              console.error('Video play failed:', err);
              resolve(false);
            });
        };
      });
    } catch(e) { 
      console.error('Camera failed:', e); 
      return false; 
    }
  }

  function startDetection(cbs={}) {
    if (!videoEl||!stream) return false;
    isActive = true;
    onViolationCb = cbs.onViolation||null; onStatusCb = cbs.onStatus||null; onEmotionCb = cbs.onEmotion||null;
    noFaceStart = null; lookAwayStart = null;
    motionHistory=[]; blinkHistory=[]; gazeHistory=[];
    interval = setInterval(()=>_detect(), DETECT_MS);
    return true;
  }

  function stopDetection() { isActive=false; if(interval){clearInterval(interval);interval=null;} }
  function stopCamera() { 
    stopDetection(); 
    if(stream){
      stream.getTracks().forEach(t => {
        t.stop();
        t.enabled = false;
      });
      stream = null;
    } 
    if(videoEl) {
      videoEl.pause();
      videoEl.srcObject = null;
      videoEl.load(); // Force release
      videoEl.remove();
      videoEl = null;
    }
    const container = document.getElementById('webcam-video-container');
    if (container) container.innerHTML = '';
  }

  async function _detect() {
    if (!isActive||!videoEl||videoEl.readyState<2) return;
    let faces=[];
    if (detector) { try{faces=await detector.detect(videoEl);}catch(e){faces=_fallbackDetect();} }
    else { faces=_fallbackDetect(); }
    _processFace(faces);
    _analyzeEmotion(faces);
    _drawOverlay(faces);
  }

  function _fallbackDetect() {
    const tc=document.createElement('canvas'), w=160, h=120;
    tc.width=w; tc.height=h;
    const c=tc.getContext('2d'); c.drawImage(videoEl,0,0,w,h);
    const d=c.getImageData(0,0,w,h).data;
    let skin=0, tot=0, cx=0, cy=0, mnX=w,mnY=h,mxX=0,mxY=0;
    for(let y=Math.floor(h*.1);y<Math.floor(h*.9);y++){
      for(let x=Math.floor(w*.15);x<Math.floor(w*.85);x++){
        const i=(y*w+x)*4, r=d[i],g=d[i+1],b=d[i+2]; tot++;
        if(_isSkin(r,g,b)){skin++;cx+=x;cy+=y;if(x<mnX)mnX=x;if(x>mxX)mxX=x;if(y<mnY)mnY=y;if(y>mxY)mxY=y;}
    }}
    if(skin/tot>0.08&&skin>200){
      const vw=videoEl.videoWidth,vh=videoEl.videoHeight,sx=vw/w,sy=vh/h;
      return[{boundingBox:{x:mnX*sx,y:mnY*sy,width:(mxX-mnX)*sx,height:(mxY-mnY)*sy},_fb:true}];
    }
    return[];
  }

  function _isSkin(r,g,b){
    if(r>95&&g>40&&b>20&&r>g&&r>b&&(Math.max(r,g,b)-Math.min(r,g,b))>15&&Math.abs(r-g)>15) return true;
    if(r>60&&g>30&&b>15&&r>g&&r>b&&(r-g)>5&&(r-b)>10) return true;
    return false;
  }

  function _processFace(faces) {
    const now=Date.now();
    if(faces.length===0){
      faceDetected=false;
      if(!noFaceStart) noFaceStart=now;
      const el=now-noFaceStart;
      if(el>NO_FACE_VIOL){_violation({type:'NO_FACE',severity:'critical',message:'No face detected for extended period'});noFaceStart=now;}
      else if(el>NO_FACE_WARN&&!lookAwayStart){_violation({type:'NO_FACE_WARNING',severity:'warning',message:'Face not detected — look at screen'});}
      _status('no-face');
    } else if(faces.length > 1) {
      _violation({type:'MULTIPLE_FACES',severity:'critical',message:'Multiple persons detected in the frame. This is a severe violation.'});
      _status('error');
    } else {
      faceDetected=true; noFaceStart=null;
      const bb=faces[0].boundingBox, vw=videoEl.videoWidth, vh=videoEl.videoHeight;
      const fcx=bb.x+bb.width/2, fcy=bb.y+bb.height/2;
      const xOff=Math.abs(fcx-vw/2)/vw, yOff=Math.abs(fcy-vh/2)/vh;
      const area=(bb.width*bb.height)/(vw*vh);

      // Track head movement for nervousness
      if(prevFaceBB){
        const dx=Math.abs(bb.x-prevFaceBB.x), dy=Math.abs(bb.y-prevFaceBB.y);
        motionHistory.push(dx+dy);
        if(motionHistory.length>30) motionHistory.shift();
      }
      prevFaceBB={x:bb.x,y:bb.y,width:bb.width,height:bb.height};

      // Gaze stability
      gazeHistory.push({x:xOff,y:yOff});
      if(gazeHistory.length>20) gazeHistory.shift();

      if(xOff>0.3||yOff>0.35){
        eyeStatus='away';
        if(!lookAwayStart) lookAwayStart=now;
        if(now-lookAwayStart>LOOK_AWAY_WARN){
          _violation({type:'LOOK_AWAY',severity:'critical',message:'Candidate looking away from screen for extended period (Fraud Detection).'});
          lookAwayStart=now;
        }
        _status('look-away');
      } else if(area<0.02){
        eyeStatus='away'; _status('too-far');
      } else {
        eyeStatus='tracking'; lookAwayStart=null; _status('ok');
      }
    }
  }

  function _analyzeEmotion(faces) {
    // Compute nervousness from head movement frequency
    const avgMotion = motionHistory.length>0 ? motionHistory.reduce((a,b)=>a+b,0)/motionHistory.length : 0;
    const motionVar = motionHistory.length>2 ? Math.sqrt(motionHistory.reduce((s,v)=>s+Math.pow(v-avgMotion,2),0)/motionHistory.length) : 0;

    // Gaze stability
    let gazeStability = 90;
    if(gazeHistory.length>5){
      const gx=gazeHistory.map(g=>g.x), gy=gazeHistory.map(g=>g.y);
      const gxVar=_variance(gx), gyVar=_variance(gy);
      gazeStability=Math.max(10, Math.min(100, 100-((gxVar+gyVar)*500)));
    }

    // Nervousness score (0-100): higher motion + gaze instability = more nervous
    const nervousness = Math.min(100, Math.max(0, Math.round(
      avgMotion*3 + motionVar*5 + (100-gazeStability)*0.5
    )));

    // Confidence inverse of nervousness + gaze stability
    const confidence = Math.min(100, Math.max(0, Math.round(
      100 - nervousness*0.6 + gazeStability*0.2
    )));

    // Engagement: face detected + looking at screen
    const engagement = faceDetected ? (eyeStatus==='tracking' ? Math.min(95,gazeStability+10) : 40) : 10;

    // Stress: high motion + frequent gaze changes
    const stress = Math.min(100, Math.max(0, Math.round(nervousness*0.7 + (100-gazeStability)*0.3)));

    // Determine emotion from metrics
    let emotion = 'neutral';
    if(nervousness>60) emotion = 'anxious';
    else if(nervousness>40) emotion = 'slightly nervous';
    else if(engagement>75 && confidence>60) emotion = 'focused';
    else if(engagement<30) emotion = 'distracted';
    else if(confidence>80) emotion = 'confident';

    // Simulate blink detection from motion spikes
    const recentMotion = motionHistory.slice(-10);
    const spikes = recentMotion.filter(m=>m>avgMotion*2).length;
    const blinkRate = Math.round(spikes * (60000/DETECT_MS/10)); // approx blinks per minute

    emotionState = {
      confidence: Math.round(confidence),
      nervousness: Math.round(nervousness),
      engagement: Math.round(engagement),
      stress: Math.round(stress),
      emotion, blinkRate,
      headMovement: Math.round(avgMotion*10)/10,
      gazeStability: Math.round(gazeStability)
    };

    if(onEmotionCb) onEmotionCb(emotionState);
  }

  function _variance(arr){
    const m=arr.reduce((a,b)=>a+b,0)/arr.length;
    return arr.reduce((s,v)=>s+Math.pow(v-m,2),0)/arr.length;
  }

  function _drawOverlay(faces) {
    if(!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    faces.forEach(f=>{
      const bb=f.boundingBox, sx=canvas.width/videoEl.videoWidth, sy=canvas.height/videoEl.videoHeight;
      const x=canvas.width-(bb.x*sx)-(bb.width*sx), y=bb.y*sy, w=bb.width*sx, h=bb.height*sy;
      const color = eyeStatus==='tracking'?'#22c55e':'#ef4444';

      // Face box
      ctx.strokeStyle=color; ctx.lineWidth=2; ctx.setLineDash([5,5]);
      ctx.strokeRect(x,y,w,h); ctx.setLineDash([]);

      // Eye regions
      const eyeY=y+h*0.28, eyeH=h*0.15;
      ctx.strokeStyle=color+'80'; ctx.lineWidth=1;
      ctx.strokeRect(x+w*0.18,eyeY,w*0.28,eyeH); // left eye
      ctx.strokeRect(x+w*0.54,eyeY,w*0.28,eyeH); // right eye

      // Gaze direction indicator
      const gcx=x+w/2, gcy=eyeY+eyeH/2;
      ctx.beginPath(); ctx.arc(gcx,gcy,3,0,Math.PI*2);
      ctx.fillStyle=color; ctx.fill();

      // Emotion label
      ctx.font='bold 10px Inter,sans-serif'; ctx.fillStyle=color;
      ctx.textAlign='center';
      ctx.fillText(emotionState.emotion.toUpperCase(), x+w/2, y-5);

      // Nervousness bar at bottom of face box
      const barW=w*0.8, barH=3, barX=x+(w-barW)/2, barY=y+h+4;
      ctx.fillStyle='rgba(255,255,255,0.1)';
      ctx.fillRect(barX,barY,barW,barH);
      const nColor = emotionState.nervousness>60?'#ef4444':emotionState.nervousness>30?'#eab308':'#22c55e';
      ctx.fillStyle=nColor;
      ctx.fillRect(barX,barY,barW*(emotionState.nervousness/100),barH);
    });
  }

  function _violation(d){d.timestamp=new Date().toISOString();if(onViolationCb)onViolationCb(d);}
  function _status(s){if(onStatusCb)onStatusCb(s,{faceDetected,eyeStatus});}
  function getStatus(){return{faceDetected,eyeStatus,isActive};}
  function getEmotionState(){return{...emotionState};}
  function isCameraActive() { 
    return stream !== null && stream.active && stream.getVideoTracks().some(t => t.readyState === 'live'); 
  }

  return{init,startCamera,stopCamera,startDetection,stopDetection,getStatus,getEmotionState,isCameraActive};
})();
