/* ============================================
   Verification Engine — Pre-Interview Checks
   ============================================ */

const VerificationEngine = (() => {
  let videoStream = null;
  let audioStream = null;
  let videoEl = null;

  async function runChecks() {
    document.getElementById('btn-start-verification').disabled = true;
    document.getElementById('btn-start-verification').textContent = 'Running Diagnostics...';

    // Reset statuses
    ['camera', 'mic', 'face', 'fullscreen'].forEach(id => _setStatus(id, 'spinner', ''));

    // Step 1: Camera
    const camPass = await _checkCamera();
    _setStatus('camera', camPass ? 'ok' : 'error', camPass ? 'Camera Connected' : 'Permission Denied');
    if (!camPass) return _fail();

    // Step 2: Microphone
    const micPass = await _checkMicrophone();
    _setStatus('mic', micPass ? 'ok' : 'error', micPass ? 'Microphone Active' : 'Permission Denied');
    if (!micPass) return _fail();

    // Step 3: Face Detection
    const facePass = await _checkFace();
    _setStatus('face', facePass ? 'ok' : 'error', facePass ? 'Face Detected' : 'No Face / Multiple Faces');
    if (!facePass) return _fail();

    // Step 4: Fullscreen
    const fsPass = await _checkFullscreen();
    _setStatus('fullscreen', fsPass ? 'ok' : 'error', fsPass ? 'Fullscreen Active' : 'Click "Enable Fullscreen" below');

    if (fsPass) {
      _success();
    } else {
      _failFullscreen();
    }
  }

  async function _checkCamera() {
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      document.getElementById('verify-preview-container').classList.remove('hidden');
      videoEl = document.getElementById('verify-video');
      videoEl.srcObject = videoStream;
      await new Promise(r => { videoEl.onloadedmetadata = r; });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function _checkMicrophone() {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function _checkFace() {
    try {
      _setStatus('face', 'loading', 'Loading ML Models...');
      // Load models
      const modelPath = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);

      _setStatus('face', 'loading', 'Detecting face...');
      await new Promise(r => setTimeout(r, 500));
      
      if (!videoEl || videoEl.videoWidth === 0) return false;

      // Use face-api to detect face
      const detections = await faceapi.detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions());
      
      if (detections.length > 0) {
        // Draw green box for visual feedback
        const faceBox = document.getElementById('verify-face-box');
        if (faceBox) {
          const det = detections[0].box;
          const containerWidth = videoEl.parentElement.clientWidth;
          const containerHeight = videoEl.parentElement.clientHeight;
          const sx = containerWidth / videoEl.videoWidth;
          const sy = containerHeight / videoEl.videoHeight;
          
          faceBox.style.display = 'block';
          faceBox.style.left = (containerWidth - (det.x * sx) - (det.width * sx)) + 'px'; // Mirrored X
          faceBox.style.top = (det.y * sy) + 'px';
          faceBox.style.width = (det.width * sx) + 'px';
          faceBox.style.height = (det.height * sy) + 'px';
          faceBox.style.borderColor = '#22c55e';
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('ML Face check failed:', e);
      return false;
    }
  }

  async function _checkFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) return true;
    try {
      await Security.requestFullscreen();
      return true;
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
      return false;
    }
  }

  function _failFullscreen() {
    document.getElementById('btn-start-verification').classList.add('hidden');
    document.getElementById('btn-enable-fullscreen').classList.remove('hidden');
  }

  window.manualEnableFullscreen = function () {
    // 1. Direct call - no async/await before this to preserve user gesture
    const el = document.documentElement;
    let promise = null;

    if (el.requestFullscreen) promise = el.requestFullscreen();
    else if (el.webkitRequestFullscreen) promise = el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) promise = el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) promise = el.msRequestFullscreen();

    if (promise) {
      promise.then(() => {
        setTimeout(() => {
          if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
            _setStatus('fullscreen', 'ok', 'Fullscreen Active');
            document.getElementById('btn-enable-fullscreen').classList.add('hidden');
            document.getElementById('btn-skip-fullscreen').classList.add('hidden');
            _success();
          }
        }, 300);
      }).catch(err => {
        console.error('Fullscreen failed:', err);
        _handleFsError();
      });
    } else {
      _handleFsError();
    }
  };

  function _handleFsError() {
    fsFailCount++;
    UI.toast('Fullscreen denied. Please try F11 or click Skip.', 'warning');
    _setStatus('fullscreen', 'error', 'Fullscreen blocked. Try F11 or Skip');
    document.getElementById('btn-enable-fullscreen').classList.add('hidden');
    document.getElementById('btn-skip-fullscreen').classList.remove('hidden');
  }

  let fsFailCount = 0;

  window.skipFullscreen = function () {
    _setStatus('fullscreen', 'warning', 'Fullscreen Bypassed');
    document.getElementById('btn-skip-fullscreen').classList.add('hidden');
    _success();
  };

  function _setStatus(id, type, message) {
    const el = document.getElementById(`verify-${id}`).querySelector('.verify-status');
    el.className = `verify-status ${type}`;
    if (type === 'spinner') el.innerHTML = '';
    else if (type === 'ok') el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${message}`;
    else if (type === 'error') el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> ${message}`;
  }

  function _fail() {
    document.getElementById('btn-start-verification').disabled = false;
    document.getElementById('btn-start-verification').textContent = 'Retry Diagnostics';
    _stopStreams();
  }

  function _success() {
    document.getElementById('btn-start-verification').classList.add('hidden');
    document.getElementById('btn-proceed-interview').classList.remove('hidden');
  }

  function stopStreams() {
    if (videoStream) {
      videoStream.getTracks().forEach(t => { t.stop(); t.enabled = false; });
      videoStream = null;
    }
    if (audioStream) {
      audioStream.getTracks().forEach(t => { t.stop(); t.enabled = false; });
      audioStream = null;
    }
    if (videoEl) {
      videoEl.pause();
      videoEl.srcObject = null;
      videoEl.load();
    }
  }

  return { runChecks, stopStreams: stopStreams };
})();

// Hook into the Proceed button
window.proceedToInterview = function () {
  const name = document.getElementById('cand-name').value.trim();
  const reg = document.getElementById('cand-reg').value.trim();

  if (!name || !reg) {
    if (typeof UI !== 'undefined') UI.toast('Please enter your Name and Register Number', 'warning');
    else alert('Please enter your Name and Register Number');
    return;
  }

  VerificationEngine.stopStreams(); 
  document.getElementById('verify-preview-container').classList.add('hidden');

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-interview').classList.add('active');
  document.body.classList.add('interview-active');

  if (window.actuallyStartInterview) {
    window.actuallyStartInterview({ name, reg });
  }
};
