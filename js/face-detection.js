/* ============================================
   Face Detection & Proctoring Module (ML Powered)
   Uses face-api.js for high-fidelity tracking
   ============================================ */

const FaceDetection = (() => {
  let videoEl = null;
  let canvas = null;
  let ctx = null;
  let stream = null;
  let detectInterval = null;
  let isActive = false;
  let isModelsLoaded = false;

  let faceDetected = false;
  let eyeStatus = 'tracking';
  let noFaceTime = 0;
  let lookAwayTime = 0;

  // Strict Configuration
  const DETECT_MS = 200;
  const NO_FACE_WARN = 1000; // 1 second
  const NO_FACE_VIOL = 2000; // 2 seconds
  const LOOK_AWAY_WARN = 1500; // 1.5 seconds

  let onStatusCb = null;
  let onViolationCb = null;
  let onEmotionCb = null;

  // Emotion / State Simulation based on Landmarks
  let emotionState = {
    emotion: 'calm',
    confidence: 85,
    nervousness: 10,
    engagement: 90,
    stress: 15,
    gazeStability: 95,
    headMovement: 'Low'
  };

  async function loadModels() {
    if (isModelsLoaded) return true;
    try {
      console.log('⏳ Loading Face-API models...');
      const modelPath = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath)
      ]);
      console.log('✅ Face-API models loaded successfully.');
      isModelsLoaded = true;
      return true;
    } catch (e) {
      console.error('Failed to load Face-API models:', e);
      return false;
    }
  }

  async function init(videoSelector) {
    videoEl = document.querySelector(videoSelector);
    if (!videoEl) {
      // Create hidden video element if PiP container not ready
      videoEl = document.createElement('video');
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.muted = true;
    }

    // Load ML models
    const modelsLoaded = await loadModels();
    if (!modelsLoaded) return false;

    return await startCamera();
  }

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      videoEl.srcObject = stream;
      await new Promise(resolve => {
        videoEl.onloadedmetadata = () => {
          videoEl.play();
          resolve();
        };
      });

      // Setup Canvas
      const container = videoEl.parentElement;
      if (container && container.id === 'webcam-video-container') {
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.pointerEvents = 'none';
          container.style.position = 'relative';
          container.appendChild(canvas);
          ctx = canvas.getContext('2d');
        }
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
      }
      return true;
    } catch (e) {
      console.error('Camera access denied:', e);
      return false;
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (videoEl) videoEl.srcObject = null;
    stopDetection();
  }

  function startDetection(callbacks = {}) {
    if (isActive) return;
    isActive = true;
    onStatusCb = callbacks.onStatus || null;
    onViolationCb = callbacks.onViolation || null;
    onEmotionCb = callbacks.onEmotion || null;

    noFaceTime = 0;
    lookAwayTime = 0;

    detectInterval = setInterval(async () => {
      if (!isModelsLoaded || !videoEl || !videoEl.videoWidth) return;

      const detections = await faceapi.detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
      
      _processDetections(detections);
      _drawOverlay(detections);

    }, DETECT_MS);
  }

  function stopDetection() {
    isActive = false;
    clearInterval(detectInterval);
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function _processDetections(detections) {
    if (detections.length === 0) {
      faceDetected = false;
      noFaceTime += DETECT_MS;
      lookAwayTime = 0;
      _status('no-face');

      if (noFaceTime >= NO_FACE_VIOL) {
        _violation({ type: 'NO_FACE', severity: 'critical' });
        noFaceTime = 0; // reset to avoid spam
      } else if (noFaceTime >= NO_FACE_WARN && noFaceTime < NO_FACE_WARN + DETECT_MS) {
        _violation({ type: 'NO_FACE_WARNING', severity: 'warning' });
      }
      return;
    }

    faceDetected = true;
    noFaceTime = 0;

    if (detections.length > 1) {
      _violation({ type: 'MULTIPLE_FACES', severity: 'critical' });
      return;
    }

    // Gaze / Head Pose Detection via Landmarks
    const landmarks = detections[0].landmarks;
    const nose = landmarks.getNose()[0];
    const leftEye = landmarks.getLeftEye()[0];
    const rightEye = landmarks.getRightEye()[3]; // inner corners

    // Calculate ratio of nose position between eyes to determine if looking away
    const eyeDist = rightEye.x - leftEye.x;
    const noseDist = nose.x - leftEye.x;
    const ratio = noseDist / eyeDist;

    // Ratio ~0.5 means looking straight. <0.2 or >0.8 means looking far side.
    const isLookingAway = ratio < 0.25 || ratio > 0.75; // More sensitive

    if (isLookingAway) {
      eyeStatus = 'away';
      lookAwayTime += DETECT_MS;
      _status('look-away');
      if (lookAwayTime >= LOOK_AWAY_WARN) {
        _violation({ type: 'LOOK_AWAY', severity: 'critical' }); // Upgraded to critical
        lookAwayTime = 0; // reset
      }
    } else {
      eyeStatus = 'tracking';
      lookAwayTime = 0;
      _status('ok');
    }

    _updateSimulatedEmotion(isLookingAway);
  }

  function _updateSimulatedEmotion(isLookingAway) {
    // Simulate real-time emotion/stress metrics for the UI based on gaze
    if (isLookingAway) {
      emotionState.engagement = Math.max(10, emotionState.engagement - 10);
      emotionState.stress = Math.min(90, emotionState.stress + 5);
      emotionState.nervousness = Math.min(80, emotionState.nervousness + 5);
    } else {
      emotionState.engagement = Math.min(95, emotionState.engagement + 5);
      emotionState.stress = Math.max(10, emotionState.stress - 2);
      emotionState.nervousness = Math.max(5, emotionState.nervousness - 2);
    }
    emotionState.confidence = 100 - emotionState.nervousness;
    emotionState.gazeStability = isLookingAway ? 40 : 90;
    emotionState.emotion = emotionState.stress > 60 ? 'nervous' : 'focused';

    if (onEmotionCb) onEmotionCb(emotionState);
  }

  function _drawOverlay(detections) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    detections.forEach(det => {
      const box = det.detection.box;
      const x = canvas.width - box.x - box.width; // Mirror X
      const y = box.y;
      const color = eyeStatus === 'tracking' ? '#22c55e' : '#ef4444';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, box.width, box.height);
      ctx.setLineDash([]);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(emotionState.emotion.toUpperCase(), x, y - 5);
      
      // Draw ML Landmarks (eyes & nose only for performance)
      const landmarks = det.landmarks;
      ctx.fillStyle = color;
      [...landmarks.getLeftEye(), ...landmarks.getRightEye(), ...landmarks.getNose()].forEach(pt => {
         const px = canvas.width - pt.x;
         ctx.beginPath();
         ctx.arc(px, pt.y, 2, 0, 2 * Math.PI);
         ctx.fill();
      });
    });
  }

  function _violation(d) {
    d.timestamp = new Date().toISOString();
    if (onViolationCb) onViolationCb(d);
  }

  function _status(s) {
    if (onStatusCb) onStatusCb(s, { faceDetected, eyeStatus });
  }

  function getStatus() { return { faceDetected, eyeStatus, isActive }; }
  function getEmotionState() { return { ...emotionState }; }
  function isCameraActive() {
    return stream !== null && stream.active && stream.getVideoTracks().some(t => t.readyState === 'live');
  }

  return { init, startCamera, stopCamera, startDetection, stopDetection, getStatus, getEmotionState, isCameraActive };
})();
