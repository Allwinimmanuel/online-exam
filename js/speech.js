/* ============================================
   Speech Module — Web Speech API (TTS + STT)
   ============================================ */

const Speech = (() => {
  let synthesis = null;
  let recognition = null;
  let isSupported = { tts: false, stt: false };
  let currentUtterance = null;
  let isRecording = false;
  let onResultCallback = null;
  let onEndCallback = null;
  let onStartCallback = null;

  function init() {
    // Text-to-Speech
    if ('speechSynthesis' in window) {
      synthesis = window.speechSynthesis;
      isSupported.tts = true;
    }

    // Speech-to-Text
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      isSupported.stt = true;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (onResultCallback) {
          onResultCallback({
            final: finalTranscript,
            interim: interimTranscript,
            full: finalTranscript || interimTranscript,
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          // Silently retry
          if (isRecording) {
            try { recognition.start(); } catch (e) {}
          }
        }
      };

      recognition.onend = () => {
        if (isRecording) {
          try { recognition.start(); } catch (e) {}
        } else if (onEndCallback) {
          onEndCallback();
        }
      };

      recognition.onstart = () => {
        if (onStartCallback) onStartCallback();
      };
    }
  }

  // ── Text-to-Speech ──
  function speak(text, options = {}) {
    return new Promise((resolve) => {
      if (!isSupported.tts || !text) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      utterance.lang = options.lang || 'en-US';

      // Try to get a natural voice
      const voices = synthesis.getVoices();
      if (voices.length > 0) {
        const preferred = voices.find(v =>
          v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        utterance.voice = preferred;
      }

      let timeoutId;
      const safeResolve = () => {
        if (timeoutId) clearTimeout(timeoutId);
        currentUtterance = null;
        resolve();
      };

      utterance.onend = safeResolve;
      utterance.onerror = safeResolve;

      // Fallback timeout in case onend never fires (browser bug)
      const maxDuration = Math.max(5000, text.length * 100);
      timeoutId = setTimeout(() => {
        console.warn('TTS onend event timed out');
        safeResolve();
      }, maxDuration);

      currentUtterance = utterance;
      
      // Resume synthesis if paused (common bug on Chrome)
      if (synthesis.paused) synthesis.resume();
      
      synthesis.speak(utterance);
    });
  }

  function stopSpeaking() {
    if (synthesis) {
      synthesis.cancel();
      currentUtterance = null;
    }
  }

  function isSpeaking() {
    return synthesis ? synthesis.speaking : false;
  }

  // ── Speech-to-Text ──
  function startListening(callbacks = {}) {
    if (!isSupported.stt) {
      console.warn('Speech recognition not supported');
      return false;
    }

    onResultCallback = callbacks.onResult || null;
    onEndCallback = callbacks.onEnd || null;
    onStartCallback = callbacks.onStart || null;
    isRecording = true;

    try {
      recognition.start();
      return true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      return false;
    }
  }

  function stopListening() {
    isRecording = false;
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
  }

  function isListening() {
    return isRecording;
  }

  // ── Support Check ──
  function getSupport() {
    return { ...isSupported };
  }

  // Load voices
  function loadVoices() {
    return new Promise((resolve) => {
      if (!synthesis) { resolve([]); return; }
      let voices = synthesis.getVoices();
      if (voices.length > 0) { resolve(voices); return; }
      synthesis.onvoiceschanged = () => {
        voices = synthesis.getVoices();
        resolve(voices);
      };
      setTimeout(() => resolve(synthesis.getVoices()), 1000);
    });
  }

  return {
    init, speak, stopSpeaking, isSpeaking,
    startListening, stopListening, isListening,
    getSupport, loadVoices,
  };
})();
