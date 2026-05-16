/* ============================================
   Storage Module — localStorage Persistence
   ============================================ */

const Storage = (() => {
  const KEYS = {
    INTERVIEWS: 'mockInterview_interviews',
    SETTINGS: 'mockInterview_settings',
    BOOKMARKS: 'mockInterview_bookmarks',
    STREAK: 'mockInterview_streak',
  };

  const DEFAULT_SETTINGS = {
    voiceEnabled: true,
    webcamEnabled: true,
    faceDetectionEnabled: true,
    aiVoiceRate: 1.0,
    aiVoicePitch: 1.0,
    fullscreenMode: true,
    soundEffects: true,
    theme: 'dark',
  };

  function _get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage read error:', e);
      return null;
    }
  }

  function _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write error:', e);
      if (e.name === 'QuotaExceededError') {
        _cleanOldInterviews();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (e2) {
          return false;
        }
      }
      return false;
    }
  }

  function _cleanOldInterviews() {
    const interviews = getInterviews();
    if (interviews.length > 50) {
      const trimmed = interviews.slice(0, 50);
      _set(KEYS.INTERVIEWS, trimmed);
    }
  }

  // ── Interview Sessions ──
  function saveInterview(session) {
    const interviews = getInterviews();
    session.id = session.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    session.timestamp = session.timestamp || new Date().toISOString();
    interviews.unshift(session);
    _set(KEYS.INTERVIEWS, interviews);
    updateStreak();
    return session;
  }

  function getInterviews() {
    return _get(KEYS.INTERVIEWS) || [];
  }

  function getInterviewById(id) {
    return getInterviews().find(i => i.id === id) || null;
  }

  function deleteInterview(id) {
    const interviews = getInterviews().filter(i => i.id !== id);
    _set(KEYS.INTERVIEWS, interviews);
  }

  function clearAllInterviews() {
    _set(KEYS.INTERVIEWS, []);
  }

  // ── Settings ──
  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...(_get(KEYS.SETTINGS) || {}) };
  }

  function updateSettings(partial) {
    const current = getSettings();
    const updated = { ...current, ...partial };
    _set(KEYS.SETTINGS, updated);
    return updated;
  }

  // ── Bookmarks ──
  function getBookmarks() {
    return _get(KEYS.BOOKMARKS) || [];
  }

  function toggleBookmark(questionId) {
    const bookmarks = getBookmarks();
    const idx = bookmarks.indexOf(questionId);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
    } else {
      bookmarks.push(questionId);
    }
    _set(KEYS.BOOKMARKS, bookmarks);
    return bookmarks;
  }

  function isBookmarked(questionId) {
    return getBookmarks().includes(questionId);
  }

  // ── Streak ──
  function updateStreak() {
    const streak = _get(KEYS.STREAK) || { count: 0, lastDate: null };
    const today = new Date().toDateString();
    if (streak.lastDate === today) return streak;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (streak.lastDate === yesterday) {
      streak.count += 1;
    } else {
      streak.count = 1;
    }
    streak.lastDate = today;
    _set(KEYS.STREAK, streak);
    return streak;
  }

  function getStreak() {
    const streak = _get(KEYS.STREAK) || { count: 0, lastDate: null };
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (streak.lastDate !== today && streak.lastDate !== yesterday) {
      streak.count = 0;
    }
    return streak;
  }

  // ── Statistics ──
  function getStats() {
    const interviews = getInterviews();
    if (interviews.length === 0) {
      return {
        total: 0, avgScore: 0, bestScore: 0, streak: 0,
        domainStats: {}, recentTrend: [], totalTime: 0,
      };
    }

    const scores = interviews.map(i => i.score || 0);
    const domainStats = {};
    let totalTime = 0;

    interviews.forEach(i => {
      const d = i.domain || 'Unknown';
      if (!domainStats[d]) domainStats[d] = { count: 0, totalScore: 0, best: 0 };
      domainStats[d].count += 1;
      domainStats[d].totalScore += (i.score || 0);
      domainStats[d].best = Math.max(domainStats[d].best, i.score || 0);
      totalTime += (i.duration || 0);
    });

    Object.keys(domainStats).forEach(d => {
      domainStats[d].avg = Math.round(domainStats[d].totalScore / domainStats[d].count);
    });

    const recentTrend = interviews.slice(0, 10).reverse().map(i => ({
      score: i.score || 0,
      date: i.timestamp,
      domain: i.domain,
    }));

    return {
      total: interviews.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      streak: getStreak().count,
      domainStats,
      recentTrend,
      totalTime,
    };
  }

  // ── Export / Import ──
  function exportData() {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      interviews: getInterviews(),
      settings: getSettings(),
      bookmarks: getBookmarks(),
      streak: getStreak(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock-interview-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.interviews) _set(KEYS.INTERVIEWS, data.interviews);
      if (data.settings) _set(KEYS.SETTINGS, data.settings);
      if (data.bookmarks) _set(KEYS.BOOKMARKS, data.bookmarks);
      if (data.streak) _set(KEYS.STREAK, data.streak);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  return {
    saveInterview, getInterviews, getInterviewById, deleteInterview, clearAllInterviews,
    getSettings, updateSettings,
    getBookmarks, toggleBookmark, isBookmarked,
    getStreak, updateStreak, getStats,
    exportData, importData,
  };
})();
