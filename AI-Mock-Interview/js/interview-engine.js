/* ============================================
   Interview Engine — Core Interview Logic
   ============================================ */
const InterviewEngine = (() => {
  let state = 'idle'; // idle, starting, greeting, questioning, answering, evaluating, followup, wrapping, finished
  let config = {};
  let questions = [];
  let currentIndex = -1;
  let results = [];
  let startTime = null;
  let questionStartTime = null;
  let timerInterval = null;
  let remainingSeconds = 0;
  let onStateChangeCallback = null;
  let onTimerCallback = null;
  let onCompleteCallback = null;
  let followUpAsked = false;

  const AI_GREETINGS = {
    'Technical': "Hello! I'm your AI technical interviewer today. We'll be going through some technical questions to assess your knowledge. Take your time to think, and answer as thoroughly as you can. Let's begin!",
    'HR': "Welcome! I'm your AI HR interviewer. Today we'll discuss your background, career goals, and soft skills. Be authentic and share real examples. Let's get started!",
    'Behavioral': "Hi there! I'm here to conduct a behavioral interview. I'll ask about past experiences — try using the STAR method (Situation, Task, Action, Result). Ready? Let's begin!",
    'System Design': "Welcome to your system design interview! I'll present scenarios and you'll walk me through your design approach. Think aloud and consider scalability. Let's start!",
    'default': "Hello! I'm your AI interviewer today. I'll be asking you a series of questions. Take your time and provide detailed answers. Let's get started!"
  };

  const AI_TRANSITIONS = [
    "Great, let's move to the next question.",
    "Thank you for your response. Here's the next one.",
    "Understood. Let's continue.",
    "Alright, moving on to the next topic.",
    "Good. Here comes the next question.",
    "Thank you. Let's try another one.",
    "Okay, next question coming up.",
  ];

  const AI_FOLLOWUPS_GENERIC = [
    "Can you elaborate a bit more on that?",
    "Interesting. Can you give a specific example?",
    "That's a good start. What else can you add?",
    "How would you apply this in a real scenario?",
  ];

  const AI_WRAPPING = "That concludes our interview session. Thank you for your time and effort. I'll now prepare your detailed performance report. Well done for completing the session!";

  function init(interviewConfig, callbacks = {}) {
    config = { ...interviewConfig };
    onStateChangeCallback = callbacks.onStateChange || null;
    onTimerCallback = callbacks.onTimer || null;
    onCompleteCallback = callbacks.onComplete || null;

    // Select questions
    const domainMap = {
      'Technical - DSA': 'DSA', 'Technical - DBMS': 'DBMS', 'Technical - OS': 'OS',
      'Technical - CN': 'CN', 'Technical - OOP': 'OOP', 'Technical - Web Dev': 'Web Dev',
      'Technical - Python': 'Python', 'Technical - Java': 'Java', 'Technical - SQL': 'SQL',
      'HR': 'HR', 'Behavioral': 'Behavioral', 'System Design': 'System Design'
    };

    const domain = domainMap[config.domain] || config.domain;
    const qCount = config.questionCount || 10;

    questions = QuestionBank.selectQuestions({
      domain: domain !== 'Mixed' ? domain : undefined,
      difficulty: config.difficulty || undefined,
      count: qCount,
    });

    if (questions.length === 0) {
      questions = QuestionBank.selectQuestions({ count: qCount });
    }

    results = [];
    currentIndex = -1;
    followUpAsked = false;
    state = 'idle';

    return questions.length;
  }

  async function start() {
    state = 'starting';
    startTime = Date.now();
    remainingSeconds = (config.duration || 30) * 60;
    _startTimer();
    _changeState('starting');

    // Greeting
    state = 'greeting';
    const domain = config.domain || 'default';
    const greetKey = Object.keys(AI_GREETINGS).find(k => domain.includes(k)) || 'default';
    const greeting = AI_GREETINGS[greetKey];
    _changeState('greeting', { message: greeting });

    // Wait for speech if enabled
    if (config.voiceEnabled) {
      const settings = Storage.getSettings();
      await Speech.speak(greeting, { rate: settings.aiVoiceRate, pitch: settings.aiVoicePitch });
    }

    // Start first question after a brief pause
    setTimeout(() => askNextQuestion(), 1000);
  }

  async function askNextQuestion() {
    currentIndex++;
    if (currentIndex >= questions.length || remainingSeconds <= 0) {
      wrapUp();
      return;
    }

    followUpAsked = false;
    state = 'questioning';
    const q = questions[currentIndex];
    questionStartTime = Date.now();

    // Transition message for non-first questions
    let transition = '';
    if (currentIndex > 0) {
      transition = AI_TRANSITIONS[Math.floor(Math.random() * AI_TRANSITIONS.length)];
    }

    const message = (transition ? transition + ' ' : '') + q.q;
    
    // Check if coding question
    if (q.type === 'coding') {
      CodeEditor.enableCodingMode(q.language || 'javascript', q.codeTemplate || '');
    } else {
      if (typeof CodeEditor !== 'undefined') CodeEditor.disableCodingMode();
    }

    _changeState('questioning', {
      question: q,
      questionNumber: currentIndex + 1,
      totalQuestions: questions.length,
      message: message,
    });

    if (config.voiceEnabled) {
      const settings = Storage.getSettings();
      await Speech.speak(message, { rate: settings.aiVoiceRate, pitch: settings.aiVoicePitch });
    }

    state = 'answering';
    _changeState('answering', { question: q });
  }

  function submitAnswer(answerText) {
    if (state !== 'answering' && state !== 'followup') return null;

    const answer = typeof CodeEditor !== 'undefined' && CodeEditor.isCodingMode() 
        ? CodeEditor.getCode() 
        : (answerText || document.getElementById('answer-input')?.value.trim() || document.getElementById('voice-transcript')?.textContent);
      
    const q = questions[currentIndex];
    const responseTime = Math.round((Date.now() - questionStartTime) / 1000);

    // Evaluate
    const evaluation = Evaluator.evaluateAnswer(q, answer);

    const result = {
      question: q,
      answer: answerText,
      evaluation: evaluation,
      responseTime: responseTime,
      questionNumber: currentIndex + 1,
    };

    // Update existing result if follow-up, or add new
    if (state === 'followup' && results.length > 0 && results[results.length - 1].question.id === q.id) {
      results[results.length - 1].answer += '\n[Follow-up] ' + answerText;
      results[results.length - 1].evaluation = Evaluator.evaluateAnswer(q, results[results.length - 1].answer);
    } else {
      results.push(result);
    }

    state = 'evaluating';
    _changeState('evaluating', { result });

    return result;
  }

  async function processAfterAnswer(result) {
    const q = questions[currentIndex];

    // Decide whether to ask follow-up
    if (!followUpAsked && result.evaluation.score < 60 && q.f && q.f.length > 0 && Math.random() > 0.4) {
      followUpAsked = true;
      state = 'followup';
      const followUp = q.f[Math.floor(Math.random() * q.f.length)];
      const message = `${result.evaluation.feedback} Let me ask a follow-up: ${followUp}`;

      _changeState('followup', { message, question: q });

      if (config.voiceEnabled) {
        const settings = Storage.getSettings();
        await Speech.speak(message, { rate: settings.aiVoiceRate, pitch: settings.aiVoicePitch });
      }

      state = 'answering';
      _changeState('answering', { question: q, isFollowUp: true });
      return;
    }

    // Give brief feedback
    const feedbackMsg = result.evaluation.score >= 70
      ? '👍 Good answer!'
      : result.evaluation.score >= 45
        ? '🤔 Decent, but could be better.'
        : '📝 Let\'s work on this topic more.';

    _changeState('feedback', { message: feedbackMsg, result });

    // Move to next question
    setTimeout(() => askNextQuestion(), 1500);
  }

  async function wrapUp() {
    state = 'wrapping';
    _stopTimer();

    _changeState('wrapping', { message: AI_WRAPPING });

    if (config.voiceEnabled) {
      const settings = Storage.getSettings();
      await Speech.speak(AI_WRAPPING, { rate: settings.aiVoiceRate, pitch: settings.aiVoicePitch });
    }

    // Analyze session
    const analysis = Evaluator.analyzeSession(results);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const violations = Security.getViolations();

    const sessionData = {
      candidateName: config.candidateName || 'Anonymous',
      regNumber: config.regNumber || 'N/A',
      isTerminated: config.isTerminated || false,
      terminationReason: config.terminationReason || null,
      domain: config.domain,
      difficulty: config.difficulty,
      duration: duration,
      timestamp: new Date().toISOString(),
      score: analysis.totalScore,
      grade: analysis.grade,
      questionsAnswered: results.length,
      totalQuestions: questions.length,
      analysis: analysis,
      violations: violations,
      config: { ...config },
    };

    // Save to storage
    Storage.saveInterview(sessionData);

    state = 'finished';
    _changeState('finished', { sessionData });

    if (onCompleteCallback) onCompleteCallback(sessionData);
  }

  function endEarly() {
    if (state === 'finished' || state === 'idle') return;
    wrapUp();
  }

  function stop() {
    _stopTimer();
    state = 'idle';
  }

  function getHint() {
    if (currentIndex < 0 || currentIndex >= questions.length) return null;
    return questions[currentIndex].h || 'Think about the core concepts related to this topic.';
  }

  async function nextQuestion() {
    if (currentIndex >= questions.length - 1) {
      return wrapUp();
    }
    
    // Show typing indicator
    const typingIndicator = document.getElementById('ai-typing-indicator');
    const avatar = document.getElementById('ai-avatar');
    if(typingIndicator) typingIndicator.classList.remove('hidden');
    if(avatar) avatar.style.animation = 'neonPulse 0.5s infinite alternate';

    currentIndex++;
    
    // Simulate AI "thinking/typing" delay (1-2 seconds)
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    
    if(typingIndicator) typingIndicator.classList.add('hidden');
    if(avatar) avatar.style.animation = 'neonPulse 2s infinite';
    
    const q = questions[currentIndex];
    results.push({
      question: q,
      answer: '',
      evaluation: Evaluator.evaluateAnswer(q, ''),
      responseTime: Math.round((Date.now() - questionStartTime) / 1000),
      questionNumber: currentIndex + 1,
      skipped: true,
    });
    askNextQuestion();
  }

  function skipQuestion() {
    if (state !== 'answering') return;
    const q = questions[currentIndex];
    results.push({
      question: q,
      answer: '',
      evaluation: Evaluator.evaluateAnswer(q, ''),
      responseTime: Math.round((Date.now() - questionStartTime) / 1000),
      questionNumber: currentIndex + 1,
      skipped: true,
    });
    askNextQuestion();
  }

  function _startTimer() {
    timerInterval = setInterval(() => {
      remainingSeconds--;
      if (onTimerCallback) onTimerCallback(remainingSeconds);
      if (remainingSeconds <= 0) {
        wrapUp();
      }
    }, 1000);
  }

  function _stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function _changeState(newState, data = {}) {
    if (onStateChangeCallback) onStateChangeCallback(newState, data);
  }

  function getState() { return state; }
  function getProgress() {
    return { current: currentIndex + 1, total: questions.length, answered: results.length };
  }
  function getResults() { return [...results]; }
  function getCurrentQuestion() { return currentIndex >= 0 ? questions[currentIndex] : null; }

  return {
    init, start, submitAnswer, processAfterAnswer, askNextQuestion,
    endEarly, stop, getHint, skipQuestion, wrapUp,
    getState, getProgress, getResults, getCurrentQuestion,
  };
})();
