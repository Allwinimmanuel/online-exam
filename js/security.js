/* ============================================
   Security Module — Anti-Cheating & Proctoring
   ============================================ */

const Security = (() => {
  let isActive = false;
  let violations = [];
  let tabSwitchCount = 0;
  let idleTimer = null;
  let idleWarningTimer = null;
  const MAX_STRIKES = 4;  // 3 warnings + 4th = termination
  let strikeCount = 0;
  const IDLE_WARNING_MS = 120000; // 2 minutes
  const IDLE_TERMINATE_MS = 300000; // 5 minutes
  let lastActivity = Date.now();
  let devToolsOpen = false;
  let fullscreenExitCount = 0;

  // Audio Monitoring State
  let audioContext = null;
  let analyser = null;
  let audioStream = null;
  let audioInterval = null;
  let highNoiseCount = 0;

  function activate(callbacks = {}) {
    if (isActive) return;
    isActive = true;
    violations = [];
    tabSwitchCount = 0;
    fullscreenExitCount = 0;
    strikeCount = 0;
    lastActivity = Date.now();
    onViolationCallback = callbacks.onViolation || null;
    onTerminateCallback = callbacks.onTerminate || null;

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

    // Fullscreen changes
    document.addEventListener('fullscreenchange', _handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', _handleFullscreenChange);

    // DevTools detection
    _startDevToolsDetection();

    // Window blur
    window.addEventListener('blur', _handleWindowBlur);

    // Resize detection
    window.addEventListener('resize', _handleResize);

    // Audio Monitoring
    _startAudioMonitoring();

    console.log('🔒 Security module activated (4-Strike System + Audio)');
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
    window.removeEventListener('blur', _handleWindowBlur);
    window.removeEventListener('resize', _handleResize);

    clearTimeout(idleTimer);
    clearTimeout(idleWarningTimer);

    console.log('🔓 Security module deactivated');
  }

  function _handleVisibility() {
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
      if (e.key === 'PrintScreen') {
        const violation = {
          type: 'SCREENSHOT_ATTEMPT',
          timestamp: new Date().toISOString(),
          severity: 'critical',
        };
        violations.push(violation);
        _triggerViolation(violation);
        _handleSevereViolation('Attempted to take a screenshot.');
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
    if (!document.fullscreenElement && !document.webkitFullscreenElement && isActive) {
      fullscreenExitCount++;
      _handleSevereViolation('Exited fullscreen mode — this is not allowed.');
    }
  }

  function _handleWarning(type, msg) {
    // Light up strike dots
    window._strikeCount = (window._strikeCount || 0) + 1;
    const dot = document.getElementById('strike-' + window._strikeCount);
    if (dot) dot.classList.add('active');

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
    if (!isActive) return;
    const violation = {
      type: 'WINDOW_BLUR',
      timestamp: new Date().toISOString(),
      severity: 'critical',
    };
    violations.push(violation);
    _triggerViolation(violation);
    _handleSevereViolation('Window lost focus — possible screenshot or app switch detected.');
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

  function _handleSevereViolation(reason) {
    strikeCount++;
    const violation = {
      type: 'STRIKE',
      timestamp: new Date().toISOString(),
      reason,
      count: strikeCount,
      severity: strikeCount >= MAX_STRIKES ? 'critical' : 'warning',
    };
    violations.push(violation);
    _triggerViolation(violation);

    if (strikeCount >= MAX_STRIKES) {
      // 4th strike = TERMINATION
      _triggerTermination(`DISQUALIFIED: Strike ${strikeCount}/${MAX_STRIKES}. ${reason}`);
    } else {
      // Strikes 1-3 = WARNING
      _handleWarning(violation.type, `⚠ STRIKE ${strikeCount}/${MAX_STRIKES - 1}: ${reason}`);
    }
  }

  // ── DevTools Detection ──
  let devToolsCheckInterval = null;
  function _startDevToolsDetection() {
    devToolsCheckInterval = setInterval(() => {
      if (!isActive) { clearInterval(devToolsCheckInterval); return; }
      const threshold = 160;
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
    if (onTerminateCallback) onTerminateCallback(reason, violations);
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

  return {
    activate, deactivate, isActivated,
    requestFullscreen, exitFullscreen,
    getViolations, getViolationCount, getTabSwitchCount, getSeverityCounts,
    triggerViolation: function(v) { _handleSevereViolation(v.type || 'External violation detected'); }
  };
})();
