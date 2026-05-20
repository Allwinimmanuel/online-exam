/* ============================================
   Security Module — Anti-Cheating & Proctoring
   ============================================ */

const Security = (() => {
  let isActive = false;
  let violations = [];
  let tabSwitchCount = 0;
  let idleTimer = null;
  let idleWarningTimer = null;
  const MAX_STRIKES = 3;  // 3 Strikes Chance System: 3 warnings before immediate termination
  let strikeCount = 0;
  let alertActive = false;
  let hasEnteredFullscreen = false;
  let blurTimeout = null;
  const IDLE_WARNING_MS = 1500000; // 25 minutes (giving plenty of time to think)
  const IDLE_TERMINATE_MS = 1800000; // 30 minutes
  let lastActivity = Date.now();
  let devToolsOpen = false;
  let fullscreenExitCount = 0;
  let onViolationCallback = null;
  let onTerminateCallback = null;
  // Grace period: ignore noise events fired by the browser during exam startup
  let _startupGrace = false;

  // Audio Monitoring State
  let audioContext = null;
  let analyser = null;
  let audioStream = null;
  let audioInterval = null;
  let highNoiseCount = 0;
  let fullscreenCheckInterval = null;

  function activate(callbacks = {}, options = {}) {
    if (isActive) return;
    isActive = true;
    violations = [];
    tabSwitchCount = 0;
    fullscreenExitCount = 0;
    strikeCount = 0;
    hasEnteredFullscreen = false;
    lastActivity = Date.now();
    onViolationCallback = callbacks.onViolation || null;
    onTerminateCallback = callbacks.onTerminate || null;

    // 3-second grace period: browser fires blur/visibility/fullscreenchange events
    // during the fullscreen transition — ignore them so no false-positive strikes occur
    _startupGrace = true;
    setTimeout(() => { _startupGrace = false; }, 3000);

    // Tab visibility
    document.addEventListener('visibilitychange', _handleVisibility);

    // Copy/paste prevention
    document.addEventListener('copy', _preventAction);
    document.addEventListener('cut', _preventAction);
    document.addEventListener('paste', _preventAction);
    document.addEventListener('contextmenu', _preventContext);

    // Keyboard shortcuts
    document.addEventListener('keydown', _handleKeydown);

    // Idle detection
    document.addEventListener('mousemove', _resetIdle);
    document.addEventListener('keypress', _resetIdle);
    document.addEventListener('click', _resetIdle);
    document.addEventListener('touchstart', _resetIdle);
    _startIdleTimer();

    // Fullscreen changes (Covering all browser vendors)
    document.addEventListener('fullscreenchange', _handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', _handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', _handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', _handleFullscreenChange);

    // Print attempt detection
    window.addEventListener('beforeprint', _handlePrintAttempt);

    // DevTools detection
    _startDevToolsDetection();

    // Periodic Fullscreen Check
    _startFullscreenPeriodicCheck();

    // Window blur & focus
    window.addEventListener('blur', _handleWindowBlur);
    window.addEventListener('focus', _handleWindowFocus);

    // Resize detection
    window.addEventListener('resize', _handleResize);

    // Audio Monitoring - only request if webcam/proctoring is enabled (Round 3+)
    const audioEnabled = !!options.webcamEnabled && options.audioEnabled !== false && callbacks.audioEnabled !== false;
    if (audioEnabled) {
      _startAudioMonitoring();
    }

    console.log('🔒 Security module activated (4-Strike System' + (audioEnabled ? ' + Audio' : '') + ')');
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;

    _stopAudioMonitoring();

    document.removeEventListener('visibilitychange', _handleVisibility);
    document.removeEventListener('copy', _preventAction);
    document.removeEventListener('cut', _preventAction);
    document.removeEventListener('paste', _preventAction);
    document.removeEventListener('contextmenu', _preventContext);
    document.removeEventListener('keydown', _handleKeydown);
    document.removeEventListener('mousemove', _resetIdle);
    document.removeEventListener('keypress', _resetIdle);
    document.removeEventListener('click', _resetIdle);
    document.removeEventListener('touchstart', _resetIdle);
    document.removeEventListener('fullscreenchange', _handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', _handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', _handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', _handleFullscreenChange);
    window.removeEventListener('blur', _handleWindowBlur);
    window.removeEventListener('focus', _handleWindowFocus);
    window.removeEventListener('resize', _handleResize);
    window.removeEventListener('beforeprint', _handlePrintAttempt);

    clearTimeout(idleTimer);
    clearTimeout(idleWarningTimer);
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    if (fullscreenCheckInterval) {
      clearInterval(fullscreenCheckInterval);
      fullscreenCheckInterval = null;
    }

    console.log('🔓 Security module deactivated');
  }

  function _handlePrintAttempt() {
    if (!isActive) return;
    _handleSevereViolation('Print attempt detected (Illegal Activity).');
  }

  function _handleVisibility() {
    if (_startupGrace || alertActive) return; // ignore browser noise during alerts
    if (document.hidden && isActive) {
      tabSwitchCount++;
      _handleSevereViolation('Tab switching detected — this is an illegal activity.');
    }
  }

  function _preventAction(e) {
    if (!isActive) return;
    e.preventDefault();
    _handleSevereViolation('Attempted copy/paste (Illegal Move).');
  }

  function _preventContext(e) {
    if (!isActive) return;
    e.preventDefault();
    const violation = {
      type: 'RIGHT_CLICK',
      timestamp: new Date().toISOString(),
      severity: 'info',
    };
    violations.push(violation);
    _triggerViolation(violation);
  }

  function _handleKeydown(e) {
    if (!isActive) return;

    // Block common shortcuts
    const blocked = [
      (e.ctrlKey && e.key === 'c'),
      (e.ctrlKey && e.key === 'v'),
      (e.ctrlKey && e.key === 'x'),
      (e.ctrlKey && e.key === 'a'),
      (e.ctrlKey && e.key === 'u'),
      (e.ctrlKey && e.shiftKey && e.key === 'I'),
      (e.ctrlKey && e.shiftKey && e.key === 'J'),
      (e.ctrlKey && e.shiftKey && e.key === 'C'),
      (e.key === 'F12'),
      (e.ctrlKey && e.key === 'p'),
      (e.key === 'PrintScreen'),
    ];

    if (blocked.some(b => b)) {
      e.preventDefault();
      e.stopPropagation();

      // F12 or DevTools shortcut = more severe
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey)) {
        const violation = {
          type: 'DEVTOOLS_ATTEMPT',
          timestamp: new Date().toISOString(),
          severity: 'critical',
        };
        violations.push(violation);
        _triggerViolation(violation);
        _handleSevereViolation('Attempted to open Developer Tools.');
      }

      // Screenshot attempt (PrintScreen)
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        const violation = {
          type: 'SCREENSHOT_ATTEMPT',
          timestamp: new Date().toISOString(),
          severity: 'critical',
        };
        violations.push(violation);
        _triggerViolation(violation);
        _handleSevereViolation('Attempted to take a screenshot (Illegal Move).');
      }

      // Block Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        _handleSevereViolation('Attempted to save the page (Illegal Move).');
      }

      return false;
    }

    // Windows+Shift+S or Cmd+Shift+4 screenshot attempt
    if ((e.metaKey && e.shiftKey && (e.key.toLowerCase() === 's' || e.key === '4' || e.key === '3')) || e.key === 'PrintScreen') {
      e.preventDefault();
      e.stopPropagation();
      const violation = {
        type: 'SCREENSHOT_ATTEMPT',
        timestamp: new Date().toISOString(),
        severity: 'critical',
      };
      violations.push(violation);
      _triggerViolation(violation);
      _handleSevereViolation('Attempted to take a screenshot.');
      return false;
    }
  }

  function _resetIdle() {
    lastActivity = Date.now();
    clearTimeout(idleWarningTimer);
    clearTimeout(idleTimer);
    if (isActive) _startIdleTimer();
  }

  function _startIdleTimer() {
    idleWarningTimer = setTimeout(() => {
      if (!isActive) return;
      const violation = {
        type: 'IDLE_WARNING',
        timestamp: new Date().toISOString(),
        severity: 'warning',
        message: 'No activity detected for 2 minutes',
      };
      violations.push(violation);
      _triggerViolation(violation);

      idleTimer = setTimeout(() => {
        if (!isActive) return;
        _triggerTermination('Inactive for too long (5 minutes)');
      }, IDLE_TERMINATE_MS - IDLE_WARNING_MS);
    }, IDLE_WARNING_MS);
  }

  function _handleFullscreenChange() {
    if (_startupGrace || alertActive) return; // ignore fullscreen noise during alerts
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    if (isFS) {
      hasEnteredFullscreen = true;
    } else {
      if (hasEnteredFullscreen && isActive) {
        fullscreenExitCount++;
        _handleSevereViolation('Exited fullscreen mode — this is not allowed.');
        requestFullscreen().catch(() => {});
      }
    }
  }

  function _handleWarning(type, msg) {
    if (typeof UI !== 'undefined') {
      UI.toast(msg, 'danger', '⚠ Security Warning');
    }

    // AI Voice Warning
    try {
      const settings = Storage.getSettings();
      if (settings && settings.voiceEnabled) Speech.speak(msg, { rate: 1.1 });
    } catch(e) {}
  }

  function _handleWindowBlur() {
    if (_startupGrace || alertActive) return; // ignore focus changes during alerts
    if (!isActive) return;

    if (blurTimeout) clearTimeout(blurTimeout);

    // 1.5 seconds grace period to allow browser native interactions (select menus, alerts, permission prompts, autocomplete)
    blurTimeout = setTimeout(() => {
      if (!isActive || _startupGrace || alertActive) return;
      if (!document.hasFocus()) {
        const violation = {
          type: 'WINDOW_BLUR',
          timestamp: new Date().toISOString(),
          severity: 'critical',
        };
        violations.push(violation);
        _triggerViolation(violation);
        _handleSevereViolation('Window lost focus — possible screenshot tool or application switch detected.');
      }
    }, 1500);
  }

  function _handleWindowFocus() {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
  }

  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  function _handleResize() {
    if (!isActive) return;
    const widthDiff = Math.abs(window.innerWidth - lastWidth);
    const heightDiff = Math.abs(window.innerHeight - lastHeight);

    if (widthDiff > 200 || heightDiff > 200) {
      const violation = {
        type: 'SUSPICIOUS_RESIZE',
        timestamp: new Date().toISOString(),
        severity: 'info',
        details: `Width: ${lastWidth}→${window.innerWidth}, Height: ${lastHeight}→${window.innerHeight}`,
      };
      violations.push(violation);
      _triggerViolation(violation);
    }
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
  }

  let lastStrikeTime = 0;

  function showProfessionalWarningModal(title, message, onConfirm) {
    const existing = document.getElementById('security-warning-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'security-warning-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.color = '#f8fafc';
    modal.style.zIndex = '2147483647';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';

    const card = document.createElement('div');
    card.style.background = 'rgba(30, 41, 59, 0.9)';
    card.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    card.style.borderRadius = '16px';
    card.style.padding = '32px';
    card.style.maxWidth = '480px';
    card.style.width = '90%';
    card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
    card.style.textAlign = 'center';
    card.style.transform = 'scale(0.9)';
    card.style.transition = 'transform 0.2s ease-out';

    card.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></svg>
      </div>
      <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; color: #ef4444; text-transform: uppercase; letter-spacing: 0.05em;">${title}</h2>
      <p style="font-size: 1.05rem; line-height: 1.6; color: #cbd5e1; margin-bottom: 28px; text-align: left; white-space: pre-line;">${message}</p>
      <button id="security-warning-btn" style="background: #ef4444; color: #ffffff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; width: 100%; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">
        I Understand
      </button>
    `;

    modal.appendChild(card);
    document.body.appendChild(modal);

    setTimeout(() => {
      card.style.transform = 'scale(1)';
    }, 10);

    const btn = card.querySelector('#security-warning-btn');
    btn.addEventListener('click', () => {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.2s ease-out';
      setTimeout(() => {
        modal.remove();
        if (onConfirm) onConfirm();
      }, 200);
    });
  }

  function _handleSevereViolation(reason) {
    const now = Date.now();
    // 1-second cooldown to prevent the same single action firing duplicate events
    if (now - lastStrikeTime < 1000) return;
    lastStrikeTime = now;

    strikeCount++;

    const dot = document.getElementById('strike-' + strikeCount);
    if (dot) dot.classList.add('active');

    const violation = {
      type: 'STRIKE',
      timestamp: new Date().toISOString(),
      reason,
      count: strikeCount,
      severity: 'critical',
    };
    violations.push(violation);
    _triggerViolation(violation);

    if (strikeCount === 1) {
      alertActive = true;
      showProfessionalWarningModal(
        'Warning 1 of 3',
        `Suspicious activity has been detected during the examination.\n\nPlease remain in fullscreen mode and follow all examination guidelines.\n\nFurther violations may lead to termination of your examination session.`,
        () => {
          alertActive = false;
          _startupGrace = true;
          setTimeout(() => { _startupGrace = false; }, 3000);
          requestFullscreen().catch(() => {});
        }
      );
    } else if (strikeCount === 2) {
      alertActive = true;
      showProfessionalWarningModal(
        'Warning 2 of 3',
        `Repeated violation of examination guidelines has been detected.\n\nYou are advised to strictly remain within the secure examination environment.\n\nAny additional violation may result in disqualification from the examination.`,
        () => {
          alertActive = false;
          _startupGrace = true;
          setTimeout(() => { _startupGrace = false; }, 3000);
          requestFullscreen().catch(() => {});
        }
      );
    } else {
      alertActive = true;
      showProfessionalWarningModal(
        'Final Warning',
        `Multiple violations of examination rules have been detected during your assessment session.\n\nAs per examination policies, your session will now be terminated.`,
        () => {
          alertActive = false;
          _triggerTermination('Your examination session has been terminated due to repeated violations of the examination guidelines and security policies.');
        }
      );
    }
  }

  // ── DevTools Detection ──
  let devToolsCheckInterval = null;
  function _startDevToolsDetection() {
    devToolsCheckInterval = setInterval(() => {
      if (!isActive || _startupGrace) { return; }
      // Increased threshold to 300 to prevent false positives from Edge sidebar, UI scaling, etc.
      const threshold = 300;
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          _handleSevereViolation('Developer Tools opened (Illegal Move).');
        }
      } else {
        devToolsOpen = false;
      }
    }, 1000);
  }

  // ── Fullscreen Periodic Check ──
  function _startFullscreenPeriodicCheck() {
    fullscreenCheckInterval = setInterval(() => {
      if (!isActive || _startupGrace || alertActive) { return; }
      const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      if (isFS) {
        hasEnteredFullscreen = true;
      } else {
        if (hasEnteredFullscreen) {
          _handleSevereViolation('Exited fullscreen mode — this is not allowed.');
          requestFullscreen().catch(() => {}); // Force fullscreen lock
        }
      }
    }, 1000);
  }

  // ── Triggers ──
  function _triggerViolation(violation) {
    console.warn('⚠️ Security violation:', violation);
    if (onViolationCallback) onViolationCallback(violation);
  }

  function _triggerTermination(reason) {
    console.error('🚫 Interview terminated:', reason);
    const violation = {
      type: 'TERMINATED',
      timestamp: new Date().toISOString(),
      reason,
      severity: 'critical',
    };
    violations.push(violation);
    
    // HARD BLOCK UI - Guarantees the exam is completely inaccessible
    const blocker = document.createElement('div');
    blocker.style.position = 'fixed';
    blocker.style.top = '0';
    blocker.style.left = '0';
    blocker.style.width = '100vw';
    blocker.style.height = '100vh';
    blocker.style.backgroundColor = 'rgba(15, 23, 42, 0.98)';
    blocker.style.color = '#ef4444';
    blocker.style.zIndex = '2147483647'; // Max z-index
    blocker.style.display = 'flex';
    blocker.style.flexDirection = 'column';
    blocker.style.alignItems = 'center';
    blocker.style.justifyContent = 'center';
    blocker.style.fontFamily = 'Inter, sans-serif';
    blocker.innerHTML = `
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 20px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h1 style="font-size: 2.5rem; margin-bottom: 20px; font-weight: 800;">EXAM TERMINATED</h1>
      <p style="font-size: 1.2rem; margin-bottom: 30px; color: #f8fafc; text-align: center; max-width: 600px;">
        ${reason}<br><br>Your session has been securely locked and your status has been recorded.
      </p>
      <button onclick="window.location.hash='#candidate-exam'; window.location.reload();" style="padding: 14px 28px; font-size: 1.1rem; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Return to Dashboard</button>
    `;
    document.body.appendChild(blocker);

    if (onTerminateCallback) {
      try { onTerminateCallback(reason, violations); } catch(e) { console.error('Terminate callback error:', e); }
    }
    deactivate();
  }

  // ── Fullscreen ──
  function requestFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
    return Promise.reject('Fullscreen API not supported');
  }

  function exitFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    return Promise.resolve();
  }

  // ══════════ AUDIO FRAUD DETECTION ══════════
  async function _startAudioMonitoring() {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      audioInterval = setInterval(() => {
        if (!isActive) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length;
        
        // If volume is consistently high, flag it
        if (avgVolume > 35) { // Threshold for background noise
          highNoiseCount++;
          if (highNoiseCount > 20) { // Roughly 4 seconds of continuous loud noise
            _handleSevereViolation('High background noise / talking detected in environment.');
            highNoiseCount = 0; // Reset after strike
          }
        } else {
          highNoiseCount = Math.max(0, highNoiseCount - 1); // Gradually reduce if quiet
        }
      }, 200);
      
    } catch (e) {
      console.warn('Audio monitoring failed to start:', e);
    }
  }

  function _stopAudioMonitoring() {
    if (audioInterval) clearInterval(audioInterval);
    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop());
      audioStream = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    highNoiseCount = 0;
  }

  // ── Public API ──
  function getViolations() {
    return [...violations];
  }

  function getViolationCount() {
    return violations.length;
  }

  function getTabSwitchCount() {
    return tabSwitchCount;
  }

  function getSeverityCounts() {
    const counts = { info: 0, warning: 0, critical: 0 };
    violations.forEach(v => { counts[v.severity] = (counts[v.severity] || 0) + 1; });
    return counts;
  }

  function isActivated() {
    return isActive;
  }

  const module = {
    activate, deactivate, isActivated,
    requestFullscreen, exitFullscreen,
    getViolations, getViolationCount, getTabSwitchCount, getSeverityCounts,
    triggerViolation: function(v) { _handleSevereViolation(v.type || 'External violation detected'); }
  };
  if (typeof window !== 'undefined') {
    window.Security = module;
  }
  return module;
})();
