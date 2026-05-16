/* ============================================
   App Controller — Main Application
   ============================================ */
const App = (() => {
  let currentScreen = 'dashboard';
  let interviewConfig = {};
  let currentSessionData = null;

  function init() {
    Speech.init();
    _setupNavigation();

    const loggedIn = sessionStorage.getItem('mockai_logged_in');
    if (!loggedIn) {
      navigateTo('login');
    } else {
      _renderDashboard();
      navigateTo('dashboard');
    }

    // Handle hash routing
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1) || 'dashboard';
      if (!sessionStorage.getItem('mockai_logged_in') && hash !== 'login') {
        navigateTo('login');
      } else {
        navigateTo(hash);
      }
    });
  }

  window.currentRole = 'candidate'; // default
  
  window.setRole = function(role) {
    window.currentRole = role;
    // Update UI buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text-muted)';
    });
    const activeBtn = document.getElementById('role-' + role + '-btn');
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.style.background = 'var(--primary-500)';
      activeBtn.style.color = 'white';
    }
  };

  window.handleLogin = function () {
    UI.toast('Verifying credentials...', 'info');
    setTimeout(() => {
      sessionStorage.setItem('mockai_logged_in', 'true');
      sessionStorage.setItem('mockai_role', window.currentRole);
      UI.toast(`Welcome back, ${window.currentRole}!`, 'success');
      document.querySelector('.main-nav').style.display = 'flex';
      
      if (window.currentRole === 'interviewer') {
        _renderInterviewerDashboard();
        navigateTo('interviewer-dashboard');
      } else {
        _renderDashboard();
        navigateTo('dashboard');
      }
    }, 1000);
  };

  function navigateTo(screen) {
    if (!screen || screen === '') screen = 'dashboard';
    // Remove active from all screens and nav
    const screens = document.querySelectorAll('.screen');
    for (let i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    const navs = document.querySelectorAll('.nav-link');
    for (let i = 0; i < navs.length; i++) navs[i].classList.remove('active');

    const el = document.getElementById('screen-' + screen);
    if (el) {
      el.classList.add('active');
      currentScreen = screen;

      // Control main nav visibility
      const nav = document.querySelector('.main-nav');
      if (screen === 'login' || screen === 'verification' || screen === 'interview') {
        if (nav) nav.style.display = 'none';
      } else {
        if (nav && sessionStorage.getItem('mockai_logged_in')) {
          nav.style.display = 'flex';
          // Ensure interview stops if we navigate away via any other means
          _endInterviewUI();
        }
      }
    } else {
      // Fallback to dashboard
      const dash = document.getElementById('screen-dashboard');
      if (dash) dash.classList.add('active');
      currentScreen = 'dashboard';
    }

    const navLink = document.querySelector('.nav-link[data-screen="' + screen + '"]');
    if (navLink) navLink.classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);

    // Render screen content
    switch (screen) {
      case 'dashboard': _renderDashboard(); break;
      case 'interviewer-dashboard': _renderInterviewerDashboard(); break;
      case 'setup': _renderSetup(); break;
      case 'history': _renderHistory(); break;
      case 'practice': _renderPractice(); break;
      case 'settings': _renderSettings(); break;
    }
  }

  function _setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var screen = this.getAttribute('data-screen');
        if (screen) {
          location.hash = screen;
          navigateTo(screen);
        }
      };
    });
  }

  // ══════════ INTERVIEWER DASHBOARD ══════════
  function _renderInterviewerDashboard() {
    // Basic mock data generation for the interviewer to review
    const mockCandidates = [
      { name: 'John Doe', domain: 'DSA', score: 85, strikes: 0, status: 'Completed' },
      { name: 'Jane Smith', domain: 'System Design', score: 92, strikes: 1, status: 'Completed' },
      { name: 'Alex Johnson', domain: 'Web Dev', score: 45, strikes: 4, status: 'Terminated' },
    ];
    
    // Check if there are real local interviews
    const realInterviews = Storage.getInterviews();
    if (realInterviews && realInterviews.length > 0) {
      mockCandidates.unshift({ 
        id: realInterviews[0].id,
        name: 'You (Local Test)', 
        domain: realInterviews[0].domain || 'Mixed', 
        score: realInterviews[0].score || 0, 
        strikes: realInterviews[0].violations ? realInterviews[0].violations.length : 0, 
        status: realInterviews[0].violations && realInterviews[0].violations.length >= 4 ? 'Terminated' : 'Completed'
      });
    }

    const tbody = document.getElementById('interviewer-candidates-list');
    if (!tbody) return;
    
    tbody.innerHTML = mockCandidates.map(c => {
      const scoreColor = c.score >= 70 ? 'var(--success-400)' : c.score >= 45 ? 'var(--warning-400)' : 'var(--danger-400)';
      const strikeColor = c.strikes >= 4 ? 'var(--danger-400)' : c.strikes > 0 ? 'var(--warning-400)' : 'var(--text-secondary)';
      const statusBadge = c.status === 'Terminated' ? 'danger' : 'success';
      const actionButton = c.id ? `<button class="btn btn-outline btn-sm" onclick="generateInterviewerReport('${c.id}')">View Report</button>` : `<button class="btn btn-outline btn-sm" onclick="UI.toast('Detailed report coming soon', 'info')">View Report</button>`;

      return `<tr style="border-bottom: 1px solid var(--border-primary); background: var(--bg-primary);">
        <td style="padding: 16px;"><strong>${c.name}</strong></td>
        <td style="padding: 16px;">${c.domain}</td>
        <td style="padding: 16px; color: ${scoreColor}; font-weight: bold;">${c.score}%</td>
        <td style="padding: 16px; color: ${strikeColor}; font-weight: bold;">${c.strikes}/4</td>
        <td style="padding: 16px;"><span class="badge badge-${statusBadge}">${c.status}</span></td>
        <td style="padding: 16px;">${actionButton}</td>
      </tr>`;
    }).join('');
  }

  window.generateInterviewerReport = function(id) {
    const interviews = Storage.getInterviews();
    const sessionData = interviews.find(i => i.id === id);
    if (sessionData && sessionData.analysis) {
      PDFReport.generate(sessionData);
      UI.toast('Report Generated', 'success');
    } else {
      UI.toast('Report data not fully available', 'error');
    }
  };

  // ══════════ DASHBOARD ══════════
  function _renderDashboard() {
    const stats = Storage.getStats();
    const streak = Storage.getStreak();

    // Stats
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-avg').textContent = stats.avgScore || '--';
    document.getElementById('stat-best').textContent = stats.bestScore || '--';
    document.getElementById('stat-streak').textContent = streak.count;

    // Animate counters
    setTimeout(() => {
      UI.animateCounter(document.getElementById('stat-total'), stats.total, 800);
      if (stats.avgScore) UI.animateCounter(document.getElementById('stat-avg'), stats.avgScore, 800);
      if (stats.bestScore) UI.animateCounter(document.getElementById('stat-best'), stats.bestScore, 800);
      UI.animateCounter(document.getElementById('stat-streak'), streak.count, 800);
    }, 200);

    // Recent history
    const recentList = document.getElementById('recent-interviews');
    const interviews = Storage.getInterviews().slice(0, 5);
    if (interviews.length === 0) {
      recentList.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div><div class="empty-state-title">No interviews yet</div><div class="empty-state-desc">Start your first mock interview to see your progress here!</div></div>';
    } else {
      recentList.innerHTML = interviews.map(i => {
        const scoreColor = i.score >= 70 ? 'var(--success-400)' : i.score >= 45 ? 'var(--warning-400)' : 'var(--danger-400)';
        return `<div class="history-item" onclick="viewResult('${i.id}')">
          <div class="history-score" style="color:${scoreColor}">${i.score}</div>
          <div class="history-info"><div class="history-domain">${i.domain || 'Mixed'}</div>
          <div class="history-meta"><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${UI.formatDate(i.timestamp)}</span><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> ${i.questionsAnswered || 0} Qs</span></div></div>
          <span class="badge badge-${i.score >= 70 ? 'success' : i.score >= 45 ? 'warning' : 'danger'}">${i.grade || '--'}</span></div>`;
      }).join('');
    }

    // Progress chart
    if (stats.recentTrend.length > 1) {
      setTimeout(() => {
        Analytics.drawLineChart('progress-chart', stats.recentTrend.map((_, i) => `#${i + 1}`), stats.recentTrend.map(t => t.score));
      }, 300);
    }
  }

  // ══════════ SETUP ══════════
  function _renderSetup() {
    interviewConfig = { domain: '', difficulty: 1, duration: 15, questionCount: 10, voiceEnabled: true, webcamEnabled: true };
    _showSetupStep(1);
  }

  function _showSetupStep(step) {
    document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`setup-step-${step}`);
    if (el) el.classList.add('active');

    // Update progress dots
    document.querySelectorAll('.setup-progress-dot').forEach((dot, i) => {
      dot.classList.remove('active', 'completed');
      if (i + 1 === step) dot.classList.add('active');
      else if (i + 1 < step) dot.classList.add('completed');
    });
    document.querySelectorAll('.setup-progress-line').forEach((line, i) => {
      line.classList.toggle('completed', i + 1 < step);
    });
  }

  window.selectDomain = function (domain) {
    interviewConfig.domain = domain;
    document.querySelectorAll('#setup-step-1 .option-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
  };

  window.selectDifficulty = function (diff) {
    interviewConfig.difficulty = diff;
    document.querySelectorAll('#setup-step-2 .option-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
  };

  window.selectDuration = function (dur) {
    interviewConfig.duration = dur;
    const qMap = { 5: 5, 15: 10, 30: 15, 45: 20, 60: 25 };
    interviewConfig.questionCount = qMap[dur] || 10;
    document.querySelectorAll('#setup-step-3 .option-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
  };

  window.nextSetupStep = function (step) {
    if (step === 2 && !interviewConfig.domain) { UI.toast('Please select a domain', 'warning'); return; }
    _showSetupStep(step);
  };

  window.prevSetupStep = function (step) { _showSetupStep(step); };

  window.startInterview = function () {
    if (!interviewConfig.domain) { UI.toast('Please complete setup', 'warning'); return; }

    const settings = Storage.getSettings();
    interviewConfig.voiceEnabled = settings.voiceEnabled;
    interviewConfig.webcamEnabled = settings.webcamEnabled;

    // Hide main nav, show verification screen
    document.querySelector('.main-nav').style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-verification').classList.add('active');

    // We do NOT call _initInterview() yet.
    // The user must pass verification checks first.
  };

  // Expose to window so verification.js can trigger the real interview start
  window.actuallyStartInterview = function () {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-interview').classList.add('active');
    document.body.classList.add('interview-active');
    _initInterview();
  };

  // ══════════ INTERVIEW ══════════
  async function _initInterview() {
    const chatArea = document.getElementById('chat-area');
    chatArea.innerHTML = '';

    const questionCount = InterviewEngine.init(interviewConfig, {
      onStateChange: _handleInterviewState,
      onTimer: _handleTimer,
      onComplete: _handleInterviewComplete,
    });

    // Update UI
    document.getElementById('interview-domain').textContent = interviewConfig.domain;
    document.getElementById('interview-timer').textContent = UI.formatTime(interviewConfig.duration * 60);
    document.getElementById('q-current').textContent = '0';
    document.getElementById('q-total').textContent = questionCount;
    document.getElementById('violation-count').textContent = '0';

    // Security
    Security.activate({
      onViolation: _handleSecurityViolation,
      onTerminate: _handleSecurityTerminate,
    });

    // Camera & Face Detection (Re-enabled per user request)
    if (interviewConfig.webcamEnabled) {
      document.getElementById('webcam-container').classList.remove('hidden');
      try {
        const camSuccess = await _initCamera();
        if (!camSuccess) {
          _handleSecurityTerminate('Camera access is strictly required. Please allow camera permissions and ensure no other app is using it.');
          return; // Stop initialization
        }
      } catch (e) {
        _handleSecurityTerminate('Camera initialization failed.');
        return;
      }
    } else {
      document.getElementById('webcam-container').classList.add('hidden');
    }

    // Fullscreen
    const settings = Storage.getSettings();
    if (settings.fullscreenMode) {
      Security.requestFullscreen();
    }

    // Show Webcam PiP in corner explicitly
    const webcamContainer = document.getElementById('webcam-container');
    if (webcamContainer && interviewConfig.webcamEnabled) {
      webcamContainer.style.display = 'block';
      webcamContainer.classList.remove('hidden');
    }

    // Start interview
    await InterviewEngine.start();
  }

  async function _initCamera() {
    try {
      const camInit = await FaceDetection.init('#webcam-video-container');
      if (!camInit) { _updateWebcamStatus('error', 'Init Failed'); return false; }
      const camStarted = await FaceDetection.startCamera();

      // EXTRA STRICT: Verify stream is actually sending data
      if (camStarted && FaceDetection.isCameraActive()) {
        FaceDetection.startDetection({
          onViolation: _handleFaceViolation,
          onStatus: _handleFaceStatus,
          onEmotion: _handleEmotionUpdate,
        });
        _updateWebcamStatus('ok', 'Face Detected');
        document.getElementById('emotion-panel')?.classList.remove('hidden');
        return true;
      } else {
        _updateWebcamStatus('error', 'Camera Blocked/Inactive');
        return false;
      }
    } catch (e) {
      _updateWebcamStatus('error', 'Camera Error');
      return false;
    }
  }

  function _handleInterviewState(state, data) {
    const chatArea = document.getElementById('chat-area');

    switch (state) {
      case 'greeting':
      case 'questioning':
      case 'followup':
      case 'wrapping':
        _updateTeleprompter(data.message);
        if (data.questionNumber) {
          document.getElementById('q-current').textContent = data.questionNumber;
        }
        break;

      case 'answering':
        _enableVoiceInput(data.isFollowUp);
        break;

      case 'feedback':
        _updateTeleprompter(data.message);
        _disableVoiceInput();
        break;

      case 'evaluating':
        _disableVoiceInput();
        break;

      case 'wrapping':
        _updateTeleprompter(data.message);
        // Force camera off immediately when concluding
        FaceDetection.stopCamera();
        const webcamContainerWrapping = document.getElementById('webcam-container');
        if (webcamContainerWrapping) {
          webcamContainerWrapping.style.display = 'none';
          webcamContainerWrapping.classList.add('hidden');
        }
        break;

      case 'finished':
        currentSessionData = data.sessionData;
        FaceDetection.stopCamera(); 
        break;
    }
  }

  function _updateTeleprompter(text) {
    const aiTextEl = document.getElementById('ai-question-text');
    if (aiTextEl) {
      aiTextEl.textContent = text;
      // Add subtle animation
      aiTextEl.style.animation = 'none';
      void aiTextEl.offsetWidth; // trigger reflow
      aiTextEl.style.animation = 'messageSlideIn 0.3s ease-out';
    }
  }

  function _enableVoiceInput(isFollowUp) {
    const btn = document.getElementById('submit-answer-btn');
    const voiceBtn = document.getElementById('voice-btn');
    if (btn) btn.disabled = false;
    if (voiceBtn) voiceBtn.disabled = false;

    document.getElementById('voice-transcript').textContent = 'Waiting for you to speak...';
    document.getElementById('voice-transcript').style.color = 'var(--text-muted)';
    document.getElementById('answer-input').value = '';

    // Automatically toggle voice if settings allow
    const settings = Storage.getSettings();
    if (settings.voiceEnabled && !Speech.isListening()) {
      setTimeout(() => toggleVoice(), 500); // Auto-start recording
    }
  }

  function _disableVoiceInput() {
    const btn = document.getElementById('submit-answer-btn');
    const voiceBtn = document.getElementById('voice-btn');
    if (btn) btn.disabled = true;
    if (voiceBtn) voiceBtn.disabled = true;

    if (Speech.isListening()) {
      toggleVoice(); // stop if it was recording
    }
  }

  function _handleTimer(seconds) {
    const timerEl = document.getElementById('interview-timer');
    timerEl.textContent = UI.formatTime(seconds);
    timerEl.parentElement.classList.remove('warning', 'danger');
    if (seconds <= 60) timerEl.parentElement.classList.add('danger');
    else if (seconds <= 300) timerEl.parentElement.classList.add('warning');
  }

  function _handleInterviewComplete(sessionData) {
    currentSessionData = sessionData;
    _endInterviewUI();
    _showResults(sessionData);
  }

  function _handleSecurityViolation(violation) {
    document.getElementById('violation-count').textContent = Security.getViolationCount();
    const messages = {
      'TAB_SWITCH': `Tab switch detected! (${violation.count}/1)`,
      'COPY_PASTE': 'Copy/paste is not allowed during interview!',
      'RIGHT_CLICK': 'Right-click is disabled during interview.',
      'DEVTOOLS_ATTEMPT': 'Developer tools are not allowed!',
      'DEVTOOLS_OPEN': 'Close developer tools immediately!',
      'IDLE_WARNING': 'No activity detected. Please continue your interview.',
      'FULLSCREEN_EXIT': 'Please stay in fullscreen mode.',
      'SUSPICIOUS_RESIZE': 'Suspicious window resize detected.',
    };
    const msg = messages[violation.type] || 'Security violation detected.';
    UI.showSecurityAlert(msg, violation.severity === 'critical' ? 'danger' : 'warning');
    UI.toast(msg, violation.severity === 'critical' ? 'danger' : 'warning', 'Security Alert');

    // Human-like AI Proctor Warning
    if (interviewConfig && interviewConfig.voiceEnabled && violation.severity !== 'critical') {
      const settings = Storage.getSettings();
      Speech.speak(`Warning. ${msg}`, { rate: settings.aiVoiceRate, pitch: settings.aiVoicePitch });
    }
  }

  function _handleSecurityTerminate(reason) {
    // Shutdown proctoring
    FaceDetection.stopCamera();
    Security.deactivate();
    
    const webcamContainer = document.getElementById('webcam-container');
    if (webcamContainer) {
      webcamContainer.style.display = 'none';
      webcamContainer.classList.add('hidden');
    }

    // Human-like AI Proctor Termination
    if (interviewConfig && interviewConfig.voiceEnabled) {
      const settings = Storage.getSettings();
      Speech.speak(`Security violation detected. This interview has been terminated. Reason: ${reason.replace(/\(Illegal Move\)/g, '')}`, { rate: settings.aiVoiceRate, pitch: settings.aiVoicePitch });
    }

    UI.showModal({
      title: 'Interview Terminated',
      content: `<p style="color:var(--danger-400)">Your interview has been terminated due to security violations.</p><p><strong>Reason:</strong> ${reason}</p><p>You will be redirected to the dashboard.</p>`,
      confirmText: 'Return Home',
      onConfirm: () => {
        window.endInterview();
      },
      onCancel: false,
    });
  }

  function _handleFaceViolation(data) {
    const messages = {
      'NO_FACE': 'No face detected! (Strike Issued)',
      'NO_FACE_WARNING': 'Face not detected — please look at the screen.',
      'LOOK_AWAY': 'Illegal Eye Movement! (Strike Issued)',
      'MULTIPLE_FACES': 'Multiple persons detected! (Strike Issued)',
      'HIGH_NERVOUSNESS': 'Take a deep breath. You seem nervous.',
    };
    const msg = messages[data.type] || 'Face detection issue.';

    if (data.severity === 'critical') {
      // Reverted to 3-Strike system per user request
      if (typeof Security !== 'undefined' && Security.isActivated()) {
        Security.triggerViolation({ 
          type: data.type, 
          severity: 'critical', 
          timestamp: new Date().toISOString() 
        });
      }
    } else {
      if (typeof UI !== 'undefined') UI.toast(msg, 'warning');
    }
  }

  function _handleEmotionUpdate(emotion) {
    const panel = document.getElementById('emotion-panel');
    if (!panel) return;
    const nervClass = emotion.nervousness > 60 ? 'nervous' : emotion.nervousness > 30 ? 'mild' : 'calm';
    const nervLabel = emotion.nervousness > 60 ? 'Nervous' : emotion.nervousness > 30 ? 'Mild Stress' : 'Calm';
    const barColor = (v) => v > 70 ? '#22c55e' : v > 40 ? '#eab308' : '#ef4444';
    const nervColor = emotion.nervousness < 30 ? '#22c55e' : emotion.nervousness < 60 ? '#eab308' : '#ef4444';
    panel.innerHTML = `
      <div class="emotion-panel-title">Real-time Analysis</div>
      <div class="emotion-item"><span class="emotion-label">Emotion</span><span class="emotion-value" style="color:var(--primary-400)">${emotion.emotion}</span></div>
      <div class="emotion-item"><span class="emotion-label">Confidence</span><div class="emotion-bar"><div class="emotion-bar-fill" style="width:${emotion.confidence}%;background:${barColor(emotion.confidence)}"></div></div><span class="emotion-value">${emotion.confidence}%</span></div>
      <div class="emotion-item"><span class="emotion-label">Engagement</span><div class="emotion-bar"><div class="emotion-bar-fill" style="width:${emotion.engagement}%;background:${barColor(emotion.engagement)}"></div></div><span class="emotion-value">${emotion.engagement}%</span></div>
      <div class="emotion-item"><span class="emotion-label">Gaze Stability</span><div class="emotion-bar"><div class="emotion-bar-fill" style="width:${emotion.gazeStability}%;background:${barColor(emotion.gazeStability)}"></div></div><span class="emotion-value">${emotion.gazeStability}%</span></div>
      <div class="emotion-item"><span class="emotion-label">Stress</span><div class="emotion-bar"><div class="emotion-bar-fill" style="width:${emotion.stress}%;background:${nervColor}"></div></div><span class="emotion-value">${emotion.stress}%</span></div>
      <div class="emotion-item"><span class="emotion-label">Head Movement</span><span class="emotion-value">${emotion.headMovement}</span></div>
      <div class="nervousness-indicator ${nervClass}">${nervLabel} (${emotion.nervousness}%)</div>`;
  }

  function _handleFaceStatus(status) {
    const labels = { 'ok': 'Face Detected', 'no-face': 'No Face', 'look-away': 'Look Away', 'too-far': 'Too Far' };
    const types = { 'ok': 'ok', 'no-face': 'error', 'look-away': 'warn', 'too-far': 'warn' };
    _updateWebcamStatus(types[status] || 'ok', labels[status] || 'Active');
  }

  function _updateWebcamStatus(type, text) {
    const el = document.getElementById('webcam-status');
    if (el) {
      el.className = `webcam-status ${type}`;
      el.innerHTML = `<span class="webcam-status-dot"></span>${text}`;
    }
    const eyeEl = document.getElementById('eye-indicator');
    if (eyeEl) {
      eyeEl.className = `eye-indicator ${type === 'ok' ? 'tracking' : 'away'}`;
      eyeEl.textContent = type === 'ok' ? 'Tracking' : 'Away';
    }
  }

  // Submit answer
  window.submitAnswer = function () {
    const textarea = document.getElementById('answer-input');
    const answer = textarea.value.trim();
    if (!answer) { UI.toast('Please say or type something before submitting!', 'warning'); return; }

    _disableVoiceInput();
    document.getElementById('voice-transcript').textContent = 'Submitting answer...';

    const result = InterviewEngine.submitAnswer(answer);
    if (result) {
      setTimeout(() => InterviewEngine.processAfterAnswer(result), 800);
    }
  };

  window.enableTypingFallback = function () {
    const textarea = document.getElementById('answer-input');
    const voiceTranscript = document.getElementById('voice-transcript');
    if (textarea) {
      textarea.classList.remove('hidden');
      textarea.style.display = 'block';
      textarea.disabled = false;
      textarea.focus();
      if (voiceTranscript) voiceTranscript.style.display = 'none';
      if (Speech.isListening()) toggleVoice();
      UI.toast('Typing mode enabled. Type your answer in the box.', 'info');
    }
  };

  // Voice recording
  window.toggleVoice = function () {
    const btn = document.getElementById('voice-btn');
    const btnText = document.getElementById('voice-btn-text');
    const transcript = document.getElementById('voice-transcript');

    if (Speech.isListening()) {
      Speech.stopListening();
      btn.classList.remove('recording');
      if (btnText) btnText.textContent = 'Start Speaking';
    } else {
      const started = Speech.startListening({
        onResult: (result) => {
          document.getElementById('answer-input').value = result.full;
          transcript.textContent = result.full || 'Listening...';
          transcript.style.color = 'var(--text-primary)';
        },
        onStart: () => {
          btn.classList.add('recording');
          if (btnText) btnText.textContent = 'Recording...';
          transcript.textContent = 'Listening...';
        },
        onEnd: () => {
          btn.classList.remove('recording');
          if (btnText) btnText.textContent = 'Start Speaking';
        },
      });
      if (!started) UI.toast('Voice input not supported in this browser', 'warning');
    }
  };

  // Get hint
  window.getHint = function () {
    const hint = InterviewEngine.getHint();
    if (hint) {
      UI.toast(hint, 'info', 'Hint');
    }
  };

  // Skip question
  window.skipQuestion = function () {
    UI.confirm('Are you sure you want to skip this question? It will be scored as 0.').then(ok => {
      if (ok) {
        _addChatMessage('user', '<em>(Question skipped)</em>');
        InterviewEngine.skipQuestion();
      }
    });
  };

  // End interview — BULLETPROOF HARDWARE SHUTDOWN
  window.endInterview = function () {
    _endInterviewUI();
    navigateTo('dashboard');
    UI.toast('Session ended. Camera off.', 'info');
  };

  function _endInterviewUI() {
    // 1. Stop interview engine & security
    try { InterviewEngine.stop(); } catch (e) { }
    try { Security.deactivate(); } catch (e) { }
    try { Security.exitFullscreen(); } catch (e) { }

    // 2. Kill camera hardware IMMEDIATELY
    try { FaceDetection.stopCamera(); } catch (e) { }
    try { if (typeof VerificationEngine !== 'undefined') VerificationEngine.stopStreams(); } catch (e) { }

    // 3. Stop speech
    try { Speech.stopSpeaking(); } catch (e) { }
    try { Speech.stopListening(); } catch (e) { }

    // 4. Hide interview UI
    document.body.classList.remove('interview-active');

    // 5. Hide PiP camera
    const webcamContainer = document.getElementById('webcam-container');
    if (webcamContainer) {
      webcamContainer.style.display = 'none';
      webcamContainer.classList.add('hidden');
    }

    // 6. Restore sidebar
    const nav = document.querySelector('.main-nav');
    if (nav && sessionStorage.getItem('mockai_logged_in')) nav.style.display = 'flex';

    // 7. Hide emotion panel
    const ep = document.getElementById('emotion-panel');
    if (ep) ep.classList.add('hidden');
  }

  // ══════════ RESULTS ══════════
  function _showResults(sessionData) {
    _endInterviewUI();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-results').classList.add('active');
    currentSessionData = sessionData;
    const a = sessionData.analysis;

    // Grade
    const gradeEl = document.getElementById('result-grade');
    gradeEl.textContent = a.grade;
    gradeEl.className = 'results-grade grade-' + (a.grade.startsWith('A') ? 'a' : a.grade === 'B' ? 'b' : a.grade === 'C' ? 'c' : a.grade === 'D' ? 'd' : 'f');

    document.getElementById('result-score').textContent = a.totalScore + ' / 100';
    document.getElementById('result-summary').textContent =
      a.totalScore >= 80 ? 'Outstanding performance! You\'re well-prepared.' :
        a.totalScore >= 60 ? 'Good performance with room for improvement.' :
          a.totalScore >= 40 ? 'Average performance. More practice needed.' : 'Needs significant improvement. Keep practicing!';

    // Metrics
    document.getElementById('result-questions').textContent = a.questionsAnswered;
    document.getElementById('result-communication').textContent = a.communicationScore + '%';
    document.getElementById('result-time').textContent = Math.round(a.avgResponseTime) + 's';
    document.getElementById('result-violations').textContent = (sessionData.violations || []).length;

    // Strengths & Weaknesses
    document.getElementById('result-strengths').innerHTML = a.strengths.map(s => `<span class="badge badge-success" style="margin:2px">✓ ${s}</span>`).join('');
    document.getElementById('result-weaknesses').innerHTML = a.weaknesses.map(w => `<span class="badge badge-danger" style="margin:2px">△ ${w}</span>`).join('');

    // Question review
    const reviewEl = document.getElementById('question-reviews');
    reviewEl.innerHTML = a.questionResults.map((r, i) => {
      const cls = r.evaluation.score >= 70 ? 'correct' : r.evaluation.score >= 45 ? 'partial' : 'wrong';
      return `<div class="question-review ${cls}">
        <div class="question-review-q">Q${i + 1}: ${r.question.q} <span class="badge badge-${cls === 'correct' ? 'success' : cls === 'partial' ? 'warning' : 'danger'}">${r.evaluation.score}/100</span></div>
        <div class="question-review-a"><strong>Your answer:</strong> ${r.answer || '<em>Skipped</em>'}</div>
        <div class="question-review-ideal"><strong>Ideal:</strong> ${r.question.a}</div>
      </div>`;
    }).join('');

    // Charts
    setTimeout(() => {
      if (a.questionResults.length > 0) {
        Analytics.drawBarChart('result-bar-chart', a.questionResults.map((_, i) => `Q${i + 1}`), a.questionResults.map(r => r.evaluation.score));
        const bkd = a.questionResults.reduce((acc, r) => {
          acc.keyword += r.evaluation.breakdown.keyword;
          acc.completeness += r.evaluation.breakdown.completeness;
          acc.relevance += r.evaluation.breakdown.relevance;
          acc.structure += r.evaluation.breakdown.structure;
          return acc;
        }, { keyword: 0, completeness: 0, relevance: 0, structure: 0 });
        const n = a.questionResults.length;
        Analytics.drawRadarChart('result-radar-chart',
          ['Keywords', 'Completeness', 'Relevance', 'Structure', 'Confidence'],
          [bkd.keyword / n, bkd.completeness / n, bkd.relevance / n, bkd.structure / n, a.avgConfidence]);
      }
    }, 400);

    // Confetti for good scores
    if (a.totalScore >= 70) UI.showConfetti();
  }

  // Download report
  window.downloadReport = function () {
    if (currentSessionData) PDFReport.generate(currentSessionData);
    else UI.toast('No report data available', 'warning');
  };

  // View result from history
  function _viewResult(id) {
    const interview = Storage.getInterviewById(id);
    if (interview && interview.analysis) _showResults(interview);
    else UI.toast('Interview data not found', 'warning');
  }
  window.viewResult = _viewResult;

  // ══════════ HISTORY ══════════
  function _renderHistory() {
    const interviews = Storage.getInterviews();
    const listEl = document.getElementById('history-list');

    if (interviews.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div class="empty-state-title">No interview history</div><div class="empty-state-desc">Complete your first interview to see it here.</div></div>';
      return;
    }

    listEl.innerHTML = interviews.map(i => {
      const scoreColor = i.score >= 70 ? 'var(--success-400)' : i.score >= 45 ? 'var(--warning-400)' : 'var(--danger-400)';
      return `<div class="history-item" onclick="viewResult('${i.id}')">
        <div class="history-score" style="color:${scoreColor}">${i.score || 0}</div>
        <div class="history-info"><div class="history-domain">${i.domain || 'Mixed'}</div>
        <div class="history-meta"><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${UI.formatDate(i.timestamp)}</span><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${Math.round((i.duration || 0) / 60)} min</span><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> ${i.questionsAnswered || 0} Qs</span></div></div>
        <span class="badge badge-${i.score >= 70 ? 'success' : i.score >= 45 ? 'warning' : 'danger'}">${i.grade || '--'}</span></div>`;
    }).join('');

    // Domain chart
    setTimeout(() => {
      const stats = Storage.getStats();
      const domains = Object.keys(stats.domainStats);
      if (domains.length > 0) {
        Analytics.drawPieChart('history-pie-chart', domains, domains.map(d => stats.domainStats[d].count));
      }
    }, 300);
  }

  // ══════════ PRACTICE ══════════
  function _renderPractice() {
    const domains = QuestionBank.getDomains();
    const container = document.getElementById('practice-domains');

    container.innerHTML = domains.map(d => {
      const qs = QuestionBank.getByDomain(d);
      return `<div class="domain-card card-interactive" onclick="showPracticeQuestions('${d}')">
        <div class="domain-card-icon"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg></div>
        <div class="domain-card-title">${d}</div>
        <div class="domain-card-desc">${qs.length} practice questions</div></div>`;
    }).join('');
  }

  window.showPracticeQuestions = function (domain) {
    const qs = QuestionBank.getByDomain(domain);
    const container = document.getElementById('practice-questions');
    const title = document.getElementById('practice-domain-title');
    title.textContent = domain + ' Questions';
    document.getElementById('practice-list-view').classList.remove('hidden');

    container.innerHTML = qs.map((q, i) => {
      const diffLabel = q.df === 1 ? 'Easy' : q.df === 2 ? 'Medium' : 'Hard';
      const diffColor = q.df === 1 ? 'success' : q.df === 2 ? 'warning' : 'danger';
      return `<div class="card" style="margin-bottom:12px;cursor:pointer" onclick="this.querySelector('.practice-answer').classList.toggle('hidden')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <strong style="flex:1">Q${i + 1}: ${q.q}</strong>
          <span class="badge badge-${diffColor}">${diffLabel}</span>
        </div>
        <div class="practice-answer hidden" style="margin-top:12px;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);border-left:3px solid var(--primary-500)">
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:8px"><strong>Answer:</strong> ${q.a}</p>
          <p style="font-size:var(--text-xs);color:var(--primary-400)"><strong>Keywords:</strong> ${q.k.join(', ')}</p>
          ${q.h ? `<p style="font-size:var(--text-xs);color:var(--warning-400);margin-top:4px"><strong>Hint:</strong> ${q.h}</p>` : ''}
        </div></div>`;
    }).join('');
  };

  window.backToPractice = function () {
    document.getElementById('practice-list-view').classList.add('hidden');
  };

  // ══════════ SETTINGS ══════════
  function _renderSettings() {
    const settings = Storage.getSettings();
    document.getElementById('setting-voice').checked = settings.voiceEnabled;
    document.getElementById('setting-webcam').checked = settings.webcamEnabled;
    document.getElementById('setting-face').checked = settings.faceDetectionEnabled;
    document.getElementById('setting-fullscreen').checked = settings.fullscreenMode;
    document.getElementById('setting-sound').checked = settings.soundEffects;
  }

  window.updateSetting = function (key, value) {
    Storage.updateSettings({ [key]: value });
    UI.toast('Setting updated', 'success');
  };

  window.exportData = function () { Storage.exportData(); UI.toast('Data exported', 'success'); };
  window.clearAllData = function () {
    UI.confirm('This will delete ALL interview history and data. Are you sure?').then(ok => {
      if (ok) { Storage.clearAllInterviews(); UI.toast('All data cleared', 'success'); _renderDashboard(); }
    });
  };

  // Answer input char counter
  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('answer-input');
    if (input) {
      input.addEventListener('input', () => {
        document.getElementById('char-count').textContent = input.value.length;
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) window.submitAnswer();
      });
    }
  });

  // Back to dashboard from results
  window.backToDashboard = function () {
    navigateTo('dashboard');
    location.hash = 'dashboard';
  };

  return { init, navigateTo, viewResult: _viewResult };
})();

// Global navigation helper for HTML onclick handlers
window.goTo = function (screen) {
  location.hash = screen;
  App.navigateTo(screen);
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
  App.init();

  // Ensure hashchange works
  window.addEventListener('hashchange', function () {
    var hash = location.hash.replace('#', '');
    if (hash) App.navigateTo(hash);
  });
});
