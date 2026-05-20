/* ============================================
   Aptitude Engine (Round 1)
   ============================================ */

const AptitudeEngine = (() => {
  let questions = [];
  let currentIndex = 0;
  let remainingSeconds = 1800;
  let timerInterval = null;
  let config = {};
  let answers = {};
  let visited = new Set();
  let markedForReview = {};
  let examActive = false;
  let startTimeMs = 0; // precise time tracking for tie-breakers

  function init(cfg) {
    config = cfg;
    questions = QuestionBank.getAptitudeQuestions(config.topic, config.count || 15);
    currentIndex = 0;
    answers = {};
    visited = new Set();
    visited.add(0); // auto-visit first question
    markedForReview = {};
    examActive = false;
    
    document.getElementById('aptitude-q-total').textContent = questions.length;
    document.getElementById('aptitude-pos-marks').textContent = '+' + (config.positiveMarks || 4);
    document.getElementById('aptitude-neg-marks').textContent = '-' + (config.negativeMarks || 1);
    
    _renderNavGrid();
  }

  function start() {
    examActive = true;
    startTimeMs = Date.now();
    remainingSeconds = (config.duration || 30) * 60;
    _startTimer();
    renderQuestion(0);

    if (config.webcamEnabled && window.proctorCameraStart) {
      window.proctorCameraStart();
    }
    
    // Automatically enforce fullscreen on exam start if not already fullscreen
    const isFS = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    if (!isFS) {
      const el = document.documentElement;
      if (el.requestFullscreen) { el.requestFullscreen().catch(() => {}); }
      else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen().catch(() => {}); }
    }

    // Enforce security with proper callbacks
    if (typeof Security !== 'undefined') {
      Security.activate({ 
        webcamEnabled: config.webcamEnabled || false, 
        fullscreenMode: true,
        strictMode: true,
        onViolation: (v) => {
          UI.toast(v.reason || 'Security violation detected', 'warning');
          if (window.saveRealtimeViolation) window.saveRealtimeViolation(v);
        },
        onTerminate: (reason) => {
          examActive = false;
          clearInterval(timerInterval);
          if (window.proctorCameraStop) window.proctorCameraStop();
          if (window.saveRealtimeTermination) window.saveRealtimeTermination(reason);
          // Removed duplicate UI.toast to prevent top-right corner noise
          if (window.navigateTo) window.navigateTo('candidate-exam');
        }
      }, {
        audioEnabled: false
      });
    }
  }

  function renderQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentIndex = index;
    visited.add(currentIndex); // track visited question
    const q = questions[currentIndex];
    
    document.getElementById('aptitude-q-current').textContent = currentIndex + 1;
    document.getElementById('aptitude-question-text').textContent = q.text;
    document.getElementById('aptitude-subtopic').textContent = q.subtopic || 'General';
    
    const optionsContainer = document.getElementById('aptitude-options-container');
    optionsContainer.innerHTML = '';
    
    ['A', 'B', 'C', 'D'].forEach((optLetter, i) => {
      if (q.options[i]) {
        const isSelected = answers[currentIndex] === optLetter;
        const btn = document.createElement('button');
        btn.className = `aptitude-option-btn ${isSelected ? 'selected' : ''}`;
        btn.innerHTML = `<span class="opt-letter">${optLetter}</span> <span class="opt-text">${q.options[i]}</span>`;
        btn.onclick = () => selectOption(optLetter);
        optionsContainer.appendChild(btn);
      }
    });

    _updateNavGridUI();
  }

  function selectOption(optLetter) {
    if (!examActive) return;
    answers[currentIndex] = optLetter;
    renderQuestion(currentIndex);
  }

  function clearSelection() {
    clearAnswer();
  }

  function clearAnswer() {
    if (!examActive) return;
    delete answers[currentIndex];
    renderQuestion(currentIndex);
    UI.toast('Answer cleared successfully.', 'success');
  }

  function saveAndNext() {
    if (!examActive) return;
    const selected = answers[currentIndex];
    if (!selected) {
      UI.toast('Please select an option before saving.', 'info');
      return;
    }
    UI.toast('Answer saved successfully.', 'success');
    if (currentIndex < questions.length - 1) {
      renderQuestion(currentIndex + 1);
    } else {
      UI.toast('You have reached the last question. You can review your answers or click Submit.', 'info');
    }
  }

  function markForReview() {
    if (!examActive) return;
    markedForReview[currentIndex] = true;
    UI.toast('Question marked for review.', 'info');
    if (currentIndex < questions.length - 1) {
      renderQuestion(currentIndex + 1);
    } else {
      UI.toast('You have reached the last question. You can review your answers or click Submit.', 'info');
    }
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      renderQuestion(currentIndex + 1);
    } else {
      UI.toast('You are on the last question.', 'info');
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      renderQuestion(currentIndex - 1);
    } else {
      UI.toast('You are on the first question.', 'info');
    }
  }

  function jumpTo(index) {
    renderQuestion(index);
  }

  function _renderNavGrid() {
    const grid = document.getElementById('aptitude-nav-grid');
    if (!grid) return;
    grid.innerHTML = questions.map((_, i) => 
      `<button id="nav-btn-${i}" class="nav-grid-btn" style="position:relative; width:36px; height:36px; border:none; font-weight:700; font-size:13px; cursor:pointer;" onclick="AptitudeEngine.jumpTo(${i})">${i + 1}</button>`
    ).join('');
  }

  function _updateNavGridUI() {
    let answeredCount = 0;
    let unansweredCount = 0;
    let reviewCount = 0;
    let notVisitedCount = 0;

    questions.forEach((_, i) => {
      const btn = document.getElementById(`nav-btn-${i}`);
      if (!btn) return;
      
      const hasAns = answers[i] !== undefined;
      const isMarked = markedForReview[i] === true;
      const isVisited = visited.has(i);
      
      let statusStyle = 'position:relative; width:36px; height:36px; border:none; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center;';
      
      if (i === currentIndex) {
        statusStyle += ' border: 2px solid var(--warning-400); box-shadow: 0 0 8px var(--warning-500);';
      }
      
      if (hasAns) {
        // Answered: ALWAYS Green Square (as requested)
        btn.style = statusStyle + ' background: #22c55e; color: #fff; border-radius: 4px;';
        btn.innerHTML = `${i + 1}`;
        answeredCount++;
      } else if (isMarked) {
        // Marked for Review but Unanswered: Purple Circle
        btn.style = statusStyle + ' background: #8b5cf6; color: #fff; border-radius: 50%;';
        btn.innerHTML = `${i + 1}`;
        reviewCount++;
      } else if (isVisited) {
        // Visited but Not Answered: Red Square
        btn.style = statusStyle + ' background: #ef4444; color: #fff; border-radius: 4px;';
        btn.innerHTML = `${i + 1}`;
        unansweredCount++;
      } else {
        // Not Visited: Grey Square
        btn.style = statusStyle + ' background: #475569; color: #cbd5e1; border-radius: 4px;';
        btn.innerHTML = `${i + 1}`;
        notVisitedCount++;
      }
    });

    const totalCount = questions.length;
    
    // Safety check in case labels aren't in DOM yet
    const lblTotal = document.getElementById('lbl-total-count');
    if (lblTotal) lblTotal.textContent = totalCount;
    
    const lblAnswered = document.getElementById('lbl-answered-count');
    if (lblAnswered) lblAnswered.textContent = answeredCount;
    
    const lblUnanswered = document.getElementById('lbl-unanswered-count');
    if (lblUnanswered) lblUnanswered.textContent = unansweredCount + reviewCount; // group unanswered and review together for stats
    
    const lblReview = document.getElementById('lbl-review-count');
    if (lblReview) lblReview.textContent = reviewCount;
  }

  function _startTimer() {
    clearInterval(timerInterval);
    _updateTimerDisplay();
    timerInterval = setInterval(() => {
      remainingSeconds--;
      _updateTimerDisplay();
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        autoSubmit();
      }
    }, 1000);
  }

  function _updateTimerDisplay() {
    const el = document.getElementById('aptitude-timer');
    if (!el) return;
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
    
    if (remainingSeconds < 300) { // last 5 mins
      el.style.animation = 'neonPulse 1s infinite alternate';
      el.style.color = 'var(--danger-400)';
    }
  }

  function autoSubmit() {
    if (!examActive) return;
    UI.toast('Time is up! Auto-submitting exam...', 'warning');
    submitExam(true);
  }

  function submitExam(isAuto = false) {
    if (!examActive) return;

    if (!isAuto) {
      const totalQuestions = questions.length;
      const answeredCount = Object.keys(answers).length;
      const reviewCount = Object.keys(markedForReview).filter(i => answers[i] === undefined).length;
      const unansweredCount = Array.from(visited).filter(i => answers[i] === undefined && markedForReview[i] !== true).length;
      const notVisitedCount = totalQuestions - visited.size;

      const summaryListHtml = questions.map((q, i) => {
        const hasAns = answers[i] !== undefined;
        const isMarked = markedForReview[i] === true;
        const isVisited = visited.has(i);

        let badgeHtml = '';
        if (hasAns) {
          badgeHtml = `<span class="badge" style="background:#22c55e; color:#fff; padding:4px 10px; border-radius:4px; font-weight:600; font-size:11px; display:inline-block;">Answered</span>`;
        } else if (isMarked) {
          badgeHtml = `<span class="badge" style="background:#8b5cf6; color:#fff; padding:4px 10px; border-radius:4px; font-weight:600; font-size:11px; display:inline-block;">Marked for Review</span>`;
        } else if (isVisited) {
          badgeHtml = `<span class="badge" style="background:#ef4444; color:#fff; padding:4px 10px; border-radius:4px; font-weight:600; font-size:11px; display:inline-block;">Not Answered</span>`;
        } else {
          badgeHtml = `<span class="badge" style="background:#475569; color:#cbd5e1; padding:4px 10px; border-radius:4px; font-weight:600; font-size:11px; display:inline-block;">Not Visited</span>`;
        }

        const shortText = q.text.length > 55 ? q.text.substring(0, 55) + '...' : q.text;

        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.05); gap:16px;">
            <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
              <strong style="color:#94a3b8; font-size:13px; min-width:32px;">Q${i + 1}</strong>
              <span style="font-size:13px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${q.text.replace(/"/g, '&quot;')}">${shortText}</span>
            </div>
            <div style="flex-shrink:0;">
              ${badgeHtml}
            </div>
          </div>
        `;
      }).join('');

      const modalContent = `
        <div style="margin-bottom:12px; font-size:13px; color:#94a3b8;">
          Review your response summary before final submission. Click on any question to return to the exam and edit.
        </div>
        <div style="max-height: 250px; overflow-y: auto; padding-right: 4px; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; background: rgba(15,23,42,0.4); margin-bottom: 20px;">
          ${summaryListHtml}
        </div>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:12px; margin-bottom: 16px; text-align:center;">
          <div>
            <div style="font-size:18px; font-weight:800; color:#22c55e;">${answeredCount}</div>
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:600; letter-spacing:0.5px;">Answered</div>
          </div>
          <div>
            <div style="font-size:18px; font-weight:800; color:#8b5cf6;">${reviewCount}</div>
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:600; letter-spacing:0.5px;">Review</div>
          </div>
          <div>
            <div style="font-size:18px; font-weight:800; color:#ef4444;">${unansweredCount}</div>
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:600; letter-spacing:0.5px;">Unanswered</div>
          </div>
          <div>
            <div style="font-size:18px; font-weight:800; color:#cbd5e1;">${notVisitedCount}</div>
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:600; letter-spacing:0.5px;">Not Visited</div>
          </div>
        </div>
        <p style="color:#e2e8f0; font-size:13px; text-align:center; margin:0; font-weight:500;">
          Are you sure you want to finalize your exam submissions?
        </p>
      `;

      UI.showModal({
        title: 'Exam Submission Summary',
        content: modalContent,
        confirmText: 'Confirm & Submit Exam',
        cancelText: '← Back to Exam',
        onConfirm: () => {
          _executeSubmit();
        },
        onCancel: () => {}
      });
      return;
    }

    _executeSubmit();

    function _executeSubmit() {
      examActive = false;
      clearInterval(timerInterval);

      const submitBtn = document.getElementById('aptitude-submit-btn') || document.querySelector('button[onclick="AptitudeEngine.submitExam()"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }
      
      let score = 0;
      let correct = 0;
      let incorrect = 0;
      const pos = config.positiveMarks || 4;
      const negEnabled = config.negativeEnabled !== false; // default true for backward compat
      const neg = negEnabled ? Math.abs(config.negativeMarks !== undefined ? config.negativeMarks : 1) : 0;

      questions.forEach((q, i) => {
        const ans = answers[i];
        if (ans) {
          if (ans === q.correctOption) {
            score += pos;
            correct++;
          } else {
            score -= neg;
            incorrect++;
          }
        }
      });

      const maxScore = questions.length * pos;
      const percentage = Math.max(0, (score / maxScore) * 100);

      const result = {
        round: 1,
        type: 'Aptitude Test',
        score,
        maxScore,
        percentage,
        correct,
        incorrect,
        unanswered: questions.length - (correct + incorrect),
        timeTaken: ((config.duration || 30) * 60) - remainingSeconds,
        timeTakenMs: Date.now() - startTimeMs, // precise ms for tie-breakers
        negativeMarkingEnabled: config.negativeEnabled || false,
        timestamp: new Date().toISOString(),
        answers: answers,
        questions: questions
      };

      if (typeof Security !== 'undefined') {
        result.violations = Security.getViolations();
        Security.deactivate();
      }

      if (window.proctorCameraStop) {
        window.proctorCameraStop();
      }

      if (window.finishAptitudeRound) {
        window.finishAptitudeRound(result);
      }
    }
  }

  const engine = { init, start, selectOption, clearSelection, clearAnswer, saveAndNext, markForReview, nextQuestion, prevQuestion, jumpTo, submitExam, getQuestions: () => questions, getAnswers: () => answers, getCurrentIndex: () => currentIndex, getMarkedForReview: () => markedForReview, getVisited: () => visited };
  if (typeof window !== 'undefined') {
    window.AptitudeEngine = engine;
  }
  return engine;
})();
