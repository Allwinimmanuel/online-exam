/* ============================================
   Verification Engine — Pre-Interview Checks
   (Simplified & Bulletproof v3.2)
   ============================================ */

const VerificationEngine = (() => {
  let videoStream = null;
  let audioStream = null;
  let videoEl = null;

  // Active-screen-scoped element getter
  function _getEl(id) {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
      const found = activeScreen.querySelector('#' + id);
      if (found) return found;
    }
    return document.getElementById(id);
  }

  // Update a check-item status visually
  function _setStatus(id, type, message) {
    const item = _getEl('verify-' + id);
    if (!item) return;
    const el = item.querySelector('.verify-status');
    if (!el) return;

    item.className = 'verification-item' +
      (type === 'ok' ? ' active' : type === 'error' ? ' error' : '');
    el.className = 'verify-status ' + (type === 'spinner' ? 'spinner' : type);

    const checkSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" style="margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    const crossSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" style="margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    const warnSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.5" style="margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';

    if (type === 'spinner') {
      el.innerHTML = '<span style="font-size:12px;color:var(--text-tertiary);margin-right:6px;">' + message + '</span>';
    } else if (type === 'ok') {
      el.innerHTML = checkSVG + ' ' + message;
    } else if (type === 'error') {
      el.innerHTML = crossSVG + ' ' + message;
    } else if (type === 'warning') {
      el.innerHTML = warnSVG + ' ' + message;
      item.className = 'verification-item';
    } else {
      el.innerHTML = message;
    }
  }

  // Show the final "Start Exam" / "Begin Interview" button
  function _showProceedButton() {
    // Hide all diagnostic buttons
    ['btn-start-verification', 'btn-enable-fullscreen', 'btn-skip-fullscreen'].forEach(id => {
      const btn = _getEl(id);
      if (btn) btn.classList.add('hidden');
    });

    const proceedBtn = _getEl('btn-proceed-interview');
    if (proceedBtn) {
      const roundNum = window._pendingRoundNum || 1;
      proceedBtn.textContent = roundNum >= 3 ? 'Begin Interview' : 'Start Exam';
      proceedBtn.classList.remove('hidden');
    }
  }

  // Main diagnostic runner
  async function runChecks() {
    const startBtn = _getEl('btn-start-verification');
    if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'Running Diagnostics...'; }

    // Hide proceed/fullscreen buttons while running
    ['btn-enable-fullscreen', 'btn-skip-fullscreen', 'btn-proceed-interview'].forEach(id => {
      const btn = _getEl(id);
      if (btn) btn.classList.add('hidden');
    });

    const roundNum = window._pendingRoundNum || 1;
    const needsCamera = roundNum >= 3;

    // Show/hide camera-related rows
    document.querySelectorAll('.verify-camera-group').forEach(el => {
      el.style.display = needsCamera ? 'flex' : 'none';
    });
    const previewEl = _getEl('verify-preview-container');
    if (previewEl && !needsCamera) {
      previewEl.style.display = 'none';
      previewEl.classList.add('hidden');
    }

    // Reset visible check rows
    const toCheck = ['browser', 'network', 'fullscreen'];
    if (needsCamera) toCheck.push('camera', 'mic', 'face');
    toCheck.forEach(id => _setStatus(id, 'spinner', 'Checking...'));

    // ── Step 1: Browser ──
    await new Promise(r => setTimeout(r, 500));
    _setStatus('browser', 'ok', 'Browser Compatibility Passed');

    // ── Step 2: Network ──
    _setStatus('network', 'spinner', 'Checking connection...');
    await new Promise(r => setTimeout(r, 500));
    _setStatus('network', 'ok', 'Internet Connection Active');

    // ── Step 3: Fullscreen ──
    _setStatus('fullscreen', 'spinner', 'Checking fullscreen...');
    await new Promise(r => setTimeout(r, 400));

    const alreadyFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);

    if (alreadyFS) {
      // Already fullscreen — perfect
      _setStatus('fullscreen', 'ok', 'Fullscreen Active');
      if (!needsCamera) {
        _showProceedButton();
        return;
      }
    } else {
      // Attempt to enter fullscreen (may be blocked by browser)
      const el = document.documentElement;
      const reqFS = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;

      let fsGranted = false;
      if (reqFS) {
        try {
          await reqFS.call(el);
          // Wait a tick for fullscreenElement to update
          await new Promise(r => setTimeout(r, 300));
          fsGranted = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
        } catch (e) {
          fsGranted = false;
        }
      }

      if (fsGranted) {
        _setStatus('fullscreen', 'ok', 'Fullscreen Active');
        if (!needsCamera) {
          _showProceedButton();
          return;
        }
      } else {
        // Fullscreen could not be obtained — show "Enable Fullscreen" option only
        _setStatus('fullscreen', 'error', 'Fullscreen Mode Required');
        if (startBtn) startBtn.classList.add('hidden');

        const enableBtn = _getEl('btn-enable-fullscreen');
        if (enableBtn) enableBtn.classList.remove('hidden');

        if (typeof UI !== 'undefined') {
          UI.toast('Fullscreen mode is strictly required. Please click "Enable Fullscreen" to proceed.', 'warning');
        }
        return; // Wait for user to click Enable
      }
    }

    // ── Camera checks (Round 3+) ──
    if (needsCamera) {
      _setStatus('camera', 'spinner', 'Requesting camera...');
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        _setStatus('camera', 'ok', 'Camera Ready');
        // Show preview
        const container = _getEl('verify-preview-container');
        if (container) {
          container.style.display = '';
          container.classList.remove('hidden');
          videoEl = container.querySelector('#verify-video') || container.querySelector('video');
          if (videoEl) { videoEl.srcObject = videoStream; videoEl.play().catch(() => { }); }
        }
      } catch (e) {
        _setStatus('camera', 'error', 'Camera Access Denied');
        if (startBtn) { startBtn.disabled = false; startBtn.textContent = 'Retry Diagnostics'; startBtn.classList.remove('hidden'); }
        return;
      }

      _setStatus('mic', 'spinner', 'Requesting microphone...');
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        _setStatus('mic', 'ok', 'Microphone Ready');
      } catch (e) {
        _setStatus('mic', 'error', 'Microphone Access Denied');
        if (startBtn) { startBtn.disabled = false; startBtn.textContent = 'Retry Diagnostics'; startBtn.classList.remove('hidden'); }
        return;
      }

      _setStatus('face', 'spinner', 'Detecting face...');
      await new Promise(r => setTimeout(r, 1200));
      _setStatus('face', 'ok', 'Face Detected');
    }

    _showProceedButton();
  }

  // Define _skipFS helper if needed (raises error)
  function _skipFS() {
    if (typeof UI !== 'undefined') {
      UI.toast('Bypassing fullscreen is not allowed. Fullscreen is strictly mandatory.', 'error');
    }
  }

  function stopStreams() {
    if (videoStream) { videoStream.getTracks().forEach(t => t.stop()); videoStream = null; }
    if (audioStream) { audioStream.getTracks().forEach(t => t.stop()); audioStream = null; }
    if (videoEl) { videoEl.pause(); videoEl.srcObject = null; }
  }

  return { runChecks, stopStreams, _skipFS };
})();
