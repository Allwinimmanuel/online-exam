/* ============================================
   Code Editor Module — Live AI Coding
   ============================================ */

const CodeEditor = (() => {
  let isCodingMode = false;

  function enableCodingMode(language = 'javascript', initialCode = '') {
    isCodingMode = true;
    document.getElementById('code-editor-container').classList.remove('hidden');
    document.getElementById('code-language-select').value = language;
    document.getElementById('code-editor-textarea').value = initialCode || `// Write your ${language} code here\n\n`;
    
    // Switch voice instructions to code mode
    document.getElementById('voice-transcript').textContent = 'Please type your code above, then click Run Code or Confirm & Submit.';
  }

  function disableCodingMode() {
    isCodingMode = false;
    document.getElementById('code-editor-container').classList.add('hidden');
  }

  function runCode() {
    const code = document.getElementById('code-editor-textarea').value;
    const lang = document.getElementById('code-language-select').value;
    
    // Basic simulated execution for frontend demo purposes
    if(lang === 'javascript') {
      try {
        // Capture console.log
        let output = [];
        const originalLog = console.log;
        console.log = (...args) => output.push(args.join(' '));
        
        // Use Function instead of eval for slight safety increase in demo
        new Function(code)();
        
        console.log = originalLog;
        UI.toast('Code Executed Successfully. Output: ' + (output.join('\\n') || '(no output)'), 'success');
      } catch(e) {
        UI.toast('Execution Error: ' + e.message, 'danger');
      }
    } else {
      UI.toast(`Simulated Execution: ${lang} code compiled and executed successfully.`, 'info');
    }
  }

  function getCode() {
    return document.getElementById('code-editor-textarea').value;
  }

  return { enableCodingMode, disableCodingMode, runCode, getCode, isCodingMode: () => isCodingMode };
})();

// Hook for UI button
window.runCode = function() {
  CodeEditor.runCode();
};
