/* ============================================
   Coding Engine (Round 2) — Full Integration
   Uses Monaco Editor & Local PHP Compiler
   ============================================ */

const CodingEngine = (() => {
  let editor      = null;
  let questions   = [];
  let currentIndex = 0;
  let remainingSeconds = 5400;
  let timerInterval   = null;
  let config      = {};
  let answers     = {};   // { [qIndex]: { code, lang } }
  let examActive  = false;
  let startTimeMs = 0;
  let editorReady = false;

  // ── Compiler URL (your existing compiler) ──
  const COMPILER_URL = 'http://localhost/Online-Compiler-main/Online-Compiler-main/compiler.php';

  // ── Language → Monaco language map ──
  const MONACO_LANG_MAP = {
    javascript: 'javascript',
    python:     'python',
    java:       'java',
    cpp:        'cpp',
    c:          'c'
  };

  // ── Language starter code templates ──
  const LANGUAGE_TEMPLATES = {
    javascript: `function solve() {
  // Write your solution here
}

solve();`,
    python: `def solve():
    # Write your solution here
    pass

if __name__ == "__main__":
    solve()`,
    java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution here
    
    return 0;
}`,
    c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Write your solution here
    
    return 0;
}`
  };

  // ─────────────────────────────────────────
  // PERSISTENCE HELPERS
  // ─────────────────────────────────────────
  const PERSIST_KEY = 'ce_state_r2';

  function _saveState() {
    try {
      // Snapshot current editor content into answers before saving
      if (editor && examActive && questions[currentIndex]) {
        answers[currentIndex] = {
          code: editor.getValue(),
          lang: document.getElementById('coding-language')?.value || 'javascript'
        };
      }
      localStorage.setItem(PERSIST_KEY, JSON.stringify({
        currentIndex,
        remainingSeconds,
        answers,
        startTimeMs,
        examActive
      }));
    } catch(e) {}
  }

  function _loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(PERSIST_KEY) || 'null');
      if (s && s.examActive) {
        currentIndex     = s.currentIndex     || 0;
        remainingSeconds = s.remainingSeconds || 5400;
        answers          = s.answers          || {};
        startTimeMs      = s.startTimeMs      || Date.now();
        return true; // has valid saved state
      }
    } catch(e) {}
    return false;
  }

  function _clearState() {
    try { localStorage.removeItem(PERSIST_KEY); } catch(e) {}
  }

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  function init(cfg) {
    config = cfg;

    // Load questions
    if (config.aiGeneratedQuestions && config.aiGeneratedQuestions.length > 0) {
      questions = config.aiGeneratedQuestions;
    } else {
      const topic = (config.topic && config.topic.length > 0) ? config.topic[0] : 'Dynamic Programming & DSA';
      questions = QuestionBank.generateAITopicQuestions([{ topic, difficulty: 'Moderate', count: config.count || 2 }]);
    }

    document.getElementById('coding-q-total').textContent = questions.length;
    _renderNavGrid();
    _initEditor();
  }

  // ─────────────────────────────────────────
  // EDITOR INIT
  // ─────────────────────────────────────────
  function _initEditor() {
    if (editorReady && editor) {
      // Re-use existing editor — just render question
      return;
    }
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
    require(['vs/editor/editor.main'], function() {
      if (editor) { editorReady = true; return; } // guard against double init
      editor = monaco.editor.create(document.getElementById('coding-editor-container'), {
        value: '// Loading...',
        language: 'javascript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on'
      });

      editor.onDidChangeModelContent(() => {
        if (examActive && questions[currentIndex]) {
          answers[currentIndex] = {
            code: editor.getValue(),
            lang: document.getElementById('coding-language')?.value || 'javascript'
          };
          _updateNavGridUI();
          _saveState();
        }
      });

      editorReady = true;
      // Auto-render question 1 as soon as editor is ready
      renderQuestion(currentIndex);
    });
  }

  // ─────────────────────────────────────────
  // START
  // ─────────────────────────────────────────
  function start() {
    examActive  = true;
    startTimeMs = Date.now();

    // Check for persisted state (refresh recovery)
    const hadSavedState = _loadState();
    if (!hadSavedState) {
      remainingSeconds = (config.duration || 90) * 60;
      currentIndex = 0;
    }

    _startTimer();

    // Render question immediately (Q1 or restored question)
    if (editorReady && editor) {
      renderQuestion(currentIndex);
    }
    // If editor not ready yet, _initEditor will call renderQuestion when done

    // Fullscreen
    const isFS = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    if (!isFS) {
      const el = document.documentElement;
      const reqFS = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (reqFS) reqFS.call(el).catch(e => console.warn('Fullscreen:', e));
    }

    if (config.webcamEnabled && window.proctorCameraStart) window.proctorCameraStart();

    if (typeof Security !== 'undefined') {
      Security.activate({
        webcamEnabled: config.webcamEnabled || false,
        fullscreenMode: true,
        strictMode: true,
        onViolation: (v) => { UI.toast(v.reason || 'Security violation detected', 'warning'); if (window.saveRealtimeViolation) window.saveRealtimeViolation(v); },
        onTerminate: (reason) => {
          examActive = false;
          clearInterval(timerInterval);
          if (window.proctorCameraStop) window.proctorCameraStop();
          if (window.saveRealtimeTermination) window.saveRealtimeTermination(reason);
          if (window.navigateTo) window.navigateTo('candidate-exam');
        }
      }, { audioEnabled: false });
    }
  }

  // ─────────────────────────────────────────
  // RENDER QUESTION
  // ─────────────────────────────────────────
  function renderQuestion(index) {
    if (index < 0 || index >= questions.length || !editor) return;
    currentIndex = index;
    const q = questions[currentIndex];

    // Update question number display
    document.getElementById('coding-q-current').textContent = currentIndex + 1;
    document.getElementById('coding-question-title').textContent = q.title || 'Untitled Problem';

    // Build description HTML
    let descHtml = q.description || '';
    if (q.statement) {
      descHtml = `<p>${q.statement}</p>`;
      if (q.constraints)  descHtml += `<h4>Constraints:</h4><pre style="background:rgba(0,0,0,0.2);padding:10px;border-radius:6px;font-size:12px;">${q.constraints}</pre>`;
      if (q.inputFormat)  descHtml += `<h4>Input Format:</h4><p style="font-size:13px;">${q.inputFormat}</p>`;
      if (q.outputFormat) descHtml += `<h4>Output Format:</h4><p style="font-size:13px;">${q.outputFormat}</p>`;
    }
    document.getElementById('coding-question-desc').innerHTML = descHtml;

    // Difficulty badge
    const diffBadge = document.getElementById('coding-difficulty');
    const difficulty = q.difficulty || 'Medium';
    diffBadge.textContent = difficulty;
    diffBadge.className = 'badge ' + (difficulty === 'Easy' ? 'badge-success' : difficulty === 'Hard' ? 'badge-danger' : 'badge-warning');

    // Examples
    const exEl = document.getElementById('coding-example-1');
    if (q.sampleInput && q.sampleOutput) {
      exEl.textContent = `Input:\n${q.sampleInput}\n\nOutput:\n${q.sampleOutput}${q.explanation ? '\n\nExplanation:\n' + q.explanation : ''}`;
    } else if (q.examples && q.examples.length > 0) {
      const ex1 = q.examples[0];
      exEl.textContent = `Input: ${ex1.input}\nOutput: ${ex1.output}${ex1.exp ? '\nExplanation: ' + ex1.exp : ''}`;
    } else {
      exEl.textContent = 'No example provided.';
    }

    // Restore or set editor content
    const saved = answers[currentIndex];
    const langSel = document.getElementById('coding-language');
    if (saved && saved.code) {
      // Restore candidate's saved code & language
      if (saved.lang && langSel) langSel.value = saved.lang;
      _setEditorContent(saved.code, saved.lang || langSel?.value || 'javascript');
    } else {
      // Load language template or question's starter code
      const lang = langSel?.value || 'javascript';
      const starterCode = q.starterCode?.[lang] || LANGUAGE_TEMPLATES[lang] || '// Write your code here\n';
      _setEditorContent(starterCode, lang);
    }

    // Reset output console
    const outputEl = document.getElementById('coding-output-console');
    if (outputEl) { outputEl.style.color = 'var(--text-muted)'; outputEl.textContent = 'Output will appear here...'; }

    _updateNavGridUI();
    _updateNavButtons();
    _saveState();
  }

  function _setEditorContent(code, lang) {
    if (!editor) return;
    editor.setValue(code);
    monaco.editor.setModelLanguage(editor.getModel(), MONACO_LANG_MAP[lang] || lang);
  }

  // ─────────────────────────────────────────
  // LANGUAGE CHANGE
  // ─────────────────────────────────────────
  window.changeCodingLanguage = function() {
    if (!editor || !examActive) return;
    const langSel = document.getElementById('coding-language');
    const newLang = langSel.value;
    const currentCode = editor.getValue().trim();
    const defaultCode = questions[currentIndex]?.starterCode?.[newLang] || LANGUAGE_TEMPLATES[newLang] || '// Write your code here\n';

    // If editor has meaningful content, ask confirmation
    const template = questions[currentIndex]?.starterCode?.[Object.keys(LANGUAGE_TEMPLATES)[0]] || LANGUAGE_TEMPLATES.javascript;
    const hasUserCode = currentCode && currentCode !== template.trim() && currentCode.length > 10 && currentCode !== '// Write your code here';

    if (hasUserCode) {
      if (!confirm('You have existing code written.\nChanging the programming language will replace your current code with the selected language template.\n\nDo you want to continue?')) {
        // Revert dropdown to previous language
        const prev = answers[currentIndex]?.lang || 'javascript';
        langSel.value = prev;
        return;
      }
    }

    _setEditorContent(defaultCode, newLang);
    if (answers[currentIndex]) {
      answers[currentIndex].lang = newLang;
      answers[currentIndex].code = defaultCode;
    }
    _saveState();
  };

  // ─────────────────────────────────────────
  // COMPILER INTEGRATION — Call existing PHP compiler
  // ─────────────────────────────────────────
  async function _callCompiler(code, lang, input) {
    const formData = new FormData();
    formData.append('text', code);
    formData.append('input', input || '');
    // Map language names to what compiler.php expects
    let phpLang = lang;
    if (lang === 'python') phpLang = 'python3';
    formData.append('language', phpLang);

    const t0 = performance.now();
    const res = await fetch(COMPILER_URL, { method: 'POST', body: formData });
    const htmlText = await res.text();
    const t1 = performance.now();
    const runtime = ((t1 - t0) / 1000).toFixed(2) + 's';

    // Parse compiler.php HTML response
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
    let rawText = (doc.body.textContent || '').trim();

    let output = '', error = '', verdict = 'ok';

    if (
      rawText.includes('Compilation Error') ||
      rawText.includes('compile error') ||
      rawText.toLowerCase().includes('compilation failed')
    ) {
      error = rawText.replace(/Compilation Error[\s:]*/i, '').replace(/Interpreted & Run Successful/g, '').replace(/Compiled & Run Successful/g, '').trim();
      verdict = 'compilation_error';
    } else if (
      rawText.includes('RunTime Error') ||
      rawText.includes('Runtime Error') ||
      rawText.includes('Exception in thread') ||
      rawText.includes('Traceback')
    ) {
      error = rawText.replace(/RunTime Error[\s:]*/i, '').replace(/Interpreted & Run Successful/g, '').replace(/Compiled & Run Successful/g, '').trim();
      verdict = 'runtime_error';
    } else if (rawText.includes('Time Limit') || rawText.includes('TLE')) {
      error = 'Time Limit Exceeded';
      verdict = 'tle';
    } else if (rawText.includes('Memory Limit') || rawText.includes('MLE')) {
      error = 'Memory Limit Exceeded';
      verdict = 'mle';
    } else {
      output = rawText
        .replace(/Compiled & Run Successful[\s]*/g, '')
        .replace(/Interpreted & Run Successful[\s]*/g, '')
        .trim();
      if (output === "Your code didn't print anything.") output = '';
    }

    return { output, error, verdict, runtime };
  }

  // ─────────────────────────────────────────
  // EVALUATE TESTCASES (uses existing compiler)
  // ─────────────────────────────────────────
  async function evaluateTestCases(code, lang, testsStr) {
    if (!testsStr || !testsStr.trim()) return [];
    const lines = testsStr.split('\n').filter(l => l.includes('|'));
    const results = [];

    for (let i = 0; i < lines.length; i++) {
      const pipeIdx = lines[i].lastIndexOf('|');
      let testIn  = lines[i].substring(0, pipeIdx).replace(/\\n/g, '\n').trim();
      let testOut = lines[i].substring(pipeIdx + 1).replace(/\\n/g, '\n').trim();

      try {
        const r = await _callCompiler(code, lang, testIn);
        const passed = !r.error && r.output === testOut;
        results.push({
          testNo: i + 1,
          passed,
          input: testIn,
          expected: testOut,
          actual: r.output,
          error: r.error,
          verdict: r.verdict,
          runtime: r.runtime
        });
      } catch(e) {
        results.push({
          testNo: i + 1, passed: false,
          input: testIn, expected: testOut,
          error: 'Network Error: Cannot connect to PHP compiler at localhost.',
          verdict: 'network_error', runtime: 'N/A'
        });
      }
    }
    return results;
  }

  // ─────────────────────────────────────────
  // RUN CODE (visible testcases)
  // ─────────────────────────────────────────
  async function runCode() {
    if (!examActive || !editor) return;

    const runBtn       = document.getElementById('coding-run-btn');
    const outputEl     = document.getElementById('coding-output-console');
    const code         = editor.getValue();
    const lang         = document.getElementById('coding-language').value;
    const q            = questions[currentIndex];

    runBtn.disabled  = true;
    runBtn.innerHTML = '⏳ Running...';
    outputEl.style.color   = 'var(--text-muted)';
    outputEl.textContent   = '⚙ Executing on compiler...';

    try {
      if (q && q.visibleTests && q.visibleTests.trim().length > 0) {
        // Run against visible test cases
        const results = await evaluateTestCases(code, lang, q.visibleTests);
        let out = '';
        let passedCount = 0;
        results.forEach(r => {
          if (r.passed) {
            passedCount++;
            out += `✅ Test Case ${r.testNo}: PASSED  (${r.runtime})\n`;
          } else {
            out += `❌ Test Case ${r.testNo}: FAILED  (${r.runtime})\n`;
            out += `   Input    : ${r.input.replace(/\n/g, ' ↵ ')}\n`;
            out += `   Expected : ${r.expected}\n`;
            if (r.error) {
              const tag = r.verdict === 'compilation_error' ? '🔴 Compilation Error' :
                          r.verdict === 'runtime_error'     ? '🟠 Runtime Error'     :
                          r.verdict === 'tle'               ? '⏱ Time Limit Exceeded':
                          r.verdict === 'mle'               ? '💾 Memory Limit'       : '❌ Error';
              out += `   ${tag}: ${r.error.split('\n')[0]}\n`;
            } else {
              out += `   Got      : ${r.actual}\n`;
            }
            out += '\n';
          }
        });
        out += `─────────────────────────────────\n`;
        out += `Result: ${passedCount} / ${results.length} visible test cases passed`;
        outputEl.textContent  = out;
        outputEl.style.color  = passedCount === results.length ? 'var(--success-400)' : 'var(--warning-400)';
      } else {
        // No test cases — just run and show stdout
        const r = await _callCompiler(code, lang, '');
        if (r.error) {
          const tag = r.verdict === 'compilation_error' ? '🔴 Compilation Error' :
                      r.verdict === 'runtime_error'     ? '🟠 Runtime Error'     :
                      r.verdict === 'tle'               ? '⏱ Time Limit Exceeded':
                      r.verdict === 'mle'               ? '💾 Memory Limit'       : '❌ Error';
          outputEl.textContent = `${tag}\n\n${r.error}`;
          outputEl.style.color = 'var(--danger-400)';
        } else {
          outputEl.textContent = r.output || '(Program exited with no output)';
          outputEl.style.color = 'var(--success-400)';
        }
      }
    } catch(e) {
      outputEl.textContent = `🔌 Network Error: Cannot reach compiler at localhost.\n\nMake sure XAMPP/Apache is running and compiler.php is accessible.`;
      outputEl.style.color = 'var(--danger-400)';
    }

    runBtn.disabled  = false;
    runBtn.innerHTML = '▶ Run Code';
  }

  // ─────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────
  function nextQuestion() {
    if (currentIndex < questions.length - 1) renderQuestion(currentIndex + 1);
  }
  function prevQuestion() {
    if (currentIndex > 0) renderQuestion(currentIndex - 1);
  }
  function jumpTo(index) { renderQuestion(index); }

  function _renderNavGrid() {
    const grid = document.getElementById('coding-nav-grid');
    if (!grid) return;
    grid.innerHTML = questions.map((_, i) =>
      `<button id="c-nav-btn-${i}" class="nav-grid-btn" onclick="CodingEngine.jumpTo(${i})">${i + 1}</button>`
    ).join('');
  }

  function _updateNavGridUI() {
    questions.forEach((_, i) => {
      const btn = document.getElementById(`c-nav-btn-${i}`);
      if (!btn) return;
      btn.className = 'nav-grid-btn';
      if (i === currentIndex) btn.classList.add('current');
      else if (answers[i] && (answers[i].code || '').trim().length > 30) btn.classList.add('answered');
    });
  }

  function _updateNavButtons() {
    // Disable Prev on Q1, Disable Next on last question
    const prevBtns = document.querySelectorAll('[onclick="CodingEngine.prevQuestion()"]');
    const nextBtns = document.querySelectorAll('[onclick="CodingEngine.nextQuestion()"]');
    prevBtns.forEach(b => { b.disabled = currentIndex === 0; b.style.opacity = currentIndex === 0 ? '0.4' : '1'; });
    nextBtns.forEach(b => { b.disabled = currentIndex === questions.length - 1; b.style.opacity = currentIndex === questions.length - 1 ? '0.4' : '1'; });
  }

  // ─────────────────────────────────────────
  // TIMER
  // ─────────────────────────────────────────
  function _startTimer() {
    clearInterval(timerInterval);
    _updateTimerDisplay();
    timerInterval = setInterval(() => {
      remainingSeconds--;
      _updateTimerDisplay();
      if (remainingSeconds % 30 === 0) _saveState(); // save every 30s
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        autoSubmit();
      }
    }, 1000);
  }

  function _updateTimerDisplay() {
    const el = document.getElementById('coding-timer');
    if (!el) return;
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
    if (remainingSeconds < 300) {
      el.style.animation = 'neonPulse 1s infinite alternate';
      el.style.color     = 'var(--danger-400)';
    } else if (remainingSeconds < 600) {
      el.style.color = 'var(--warning-400)';
    }
  }

  function autoSubmit() {
    if (!examActive) return;
    UI.toast('⏱ Time is up! Auto-submitting...', 'warning');
    submitExam(true);
  }

  // ─────────────────────────────────────────
  // SUBMIT EXAM (hidden testcase evaluation)
  // ─────────────────────────────────────────
  async function submitExam(isAuto = false) {
    if (!examActive) return;

    if (!isAuto) {
      if (!confirm('Are you sure you want to submit your coding assessment?\n\nThis will evaluate all hidden test cases.')) return;
    }

    examActive = false;
    clearInterval(timerInterval);
    _saveState();

    const submitBtn = document.querySelector('button[onclick="CodingEngine.submitExam()"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Submitting...'; }

    const outputEl = document.getElementById('coding-output-console');
    outputEl.style.color  = 'var(--text-muted)';
    outputEl.textContent  = '⚙ Evaluating hidden test cases using compiler... Please wait.';

    // Evaluate ALL questions
    let totalPassed = 0, totalTests = 0;
    const questionResults = [];
    const lang = document.getElementById('coding-language')?.value || 'javascript';
    const timeTaken = ((config.duration || 90) * 60) - remainingSeconds;

    for (let qi = 0; qi < questions.length; qi++) {
      const q    = questions[qi];
      const saved = answers[qi] || {};
      const code  = saved.code || (editor && qi === currentIndex ? editor.getValue() : '');
      const qLang = saved.lang || lang;

      let qPassed = 0, qTotal = 0;
      let qVerdict = 'Not Attempted';
      let qError   = '';

      const testsStr = q.hiddenTests && q.hiddenTests.trim() ? q.hiddenTests : q.visibleTests;

      if (code && code.trim().length > 5 && testsStr && testsStr.trim()) {
        const results = await evaluateTestCases(code, qLang, testsStr);
        qTotal  = results.length;
        qPassed = results.filter(r => r.passed).length;
        totalPassed += qPassed;
        totalTests  += qTotal;

        // Determine per-question verdict
        const hasCompErr  = results.some(r => r.verdict === 'compilation_error');
        const hasRtErr    = results.some(r => r.verdict === 'runtime_error');
        const hasTLE      = results.some(r => r.verdict === 'tle');
        const hasMLE      = results.some(r => r.verdict === 'mle');
        if (hasCompErr)        qVerdict = 'Compilation Error';
        else if (hasTLE)       qVerdict = 'Time Limit Exceeded';
        else if (hasMLE)       qVerdict = 'Memory Limit Exceeded';
        else if (hasRtErr)     qVerdict = 'Runtime Error';
        else if (qPassed === qTotal) qVerdict = 'Accepted';
        else if (qPassed > 0)  qVerdict = 'Partially Passed';
        else                   qVerdict = 'Failed';

        if (hasCompErr || hasRtErr) {
          const errResult = results.find(r => r.error);
          qError = errResult ? errResult.error.split('\n')[0] : '';
        }
      } else if (!code || code.trim().length <= 5) {
        qVerdict = 'Not Attempted';
      } else {
        qVerdict = 'No Test Cases';
      }

      questionResults.push({
        questionNo: qi + 1,
        title:      q.title,
        difficulty: q.difficulty,
        verdict:    qVerdict,
        passed:     qPassed,
        total:      qTotal,
        percentage: qTotal > 0 ? Math.round((qPassed / qTotal) * 100) : 0,
        language:   qLang,
        error:      qError,
        code:       code
      });
    }

    const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    let finalVerdict = 'Failed';
    let verdictColor = 'var(--danger-400)';
    if (overallPercentage === 100) { finalVerdict = '✅ Accepted';        verdictColor = 'var(--success-400)'; }
    else if (overallPercentage >= 50) { finalVerdict = '⚠ Partially Passed'; verdictColor = 'var(--warning-400)'; }
    else if (overallPercentage > 0)   { finalVerdict = '❌ Failed';           verdictColor = 'var(--danger-400)'; }

    // LeetCode-style result display in existing output console
    const qResultRows = questionResults.map(qr => {
      const vc = qr.verdict === 'Accepted' ? '#4ade80' :
                 qr.verdict === 'Partially Passed' ? '#fbbf24' :
                 qr.verdict === 'Not Attempted'    ? 'var(--text-tertiary)' : '#f87171';
      return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="color:#fff;font-weight:500;">Q${qr.questionNo}. ${qr.title}</span>
        <span style="color:${vc};font-weight:600;">${qr.verdict} (${qr.passed}/${qr.total})</span>
      </div>`;
    }).join('');

    outputEl.innerHTML = `
      <div style="font-family:monospace;line-height:1.7;padding:4px;">
        <h3 style="color:${verdictColor};margin:0 0 12px;font-size:16px;letter-spacing:.5px;">${finalVerdict}</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div>Passed Test Cases: <strong style="color:#4ade80">${totalPassed} / ${totalTests}</strong></div>
          <div>Pass Percentage: <strong style="color:${verdictColor}">${overallPercentage}%</strong></div>
          <div>Time Taken: <strong>${Math.floor(timeTaken/60)}m ${timeTaken%60}s</strong></div>
          <div>Language: <strong>${lang.toUpperCase()}</strong></div>
        </div>
        <div style="margin-bottom:12px;font-size:12px;color:var(--text-tertiary);border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;">
          <strong style="color:var(--text-secondary);font-size:13px;">Question-wise Results</strong>
          ${qResultRows}
        </div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:8px;">Score saved to Interviewer Dashboard.</div>
      </div>`;

    // Build final result object for dashboard
    const result = {
      round:          2,
      type:           'Coding Assessment',
      score:          overallPercentage,
      maxScore:       100,
      percentage:     overallPercentage,
      finalVerdict:   finalVerdict.replace(/^[✅⚠❌]\s*/, ''),
      timeTaken:      timeTaken,
      timeTakenMs:    Date.now() - startTimeMs,
      timestamp:      new Date().toISOString(),
      language:       lang,
      codeSubmissions: answers,
      questions:      questions,
      questionResults: questionResults,
      testCaseResults: {
        total:      totalTests,
        passed:     totalPassed,
        failed:     totalTests - totalPassed,
        percentage: overallPercentage,
        status:     finalVerdict.replace(/^[✅⚠❌]\s*/, '')
      }
    };

    if (typeof Security !== 'undefined') {
      result.violations = Security.getViolations();
      Security.deactivate();
    }
    if (window.proctorCameraStop) window.proctorCameraStop();

    _clearState(); // Remove persisted state on successful submit

    setTimeout(() => {
      if (window.finishCodingRound) window.finishCodingRound(result);
    }, 3500);
  }

  // ─────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────
  const engine = {
    init, start, nextQuestion, prevQuestion, jumpTo, submitExam, runCode,
    getQuestions:    () => questions,
    getAnswers:      () => answers,
    getCurrentIndex: () => currentIndex,
    evaluateTestCases
  };
  if (typeof window !== 'undefined') window.CodingEngine = engine;
  return engine;
})();
