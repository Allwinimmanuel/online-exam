/* ============================================
   Storage Module — localStorage Persistence
   ============================================ */

const Storage = (() => {
  const KEYS = {
    INTERVIEWS: 'mockInterview_interviews',
    SETTINGS: 'mockInterview_settings',
    BOOKMARKS: 'mockInterview_bookmarks',
    STREAK: 'mockInterview_streak',
    DRIVES: 'mockInterview_drives',
    CANDIDATES: 'mockInterview_candidates'
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
    _set(KEYS.DRIVES, []);
    _set(KEYS.CANDIDATES, {});
    _set(KEYS.STREAK, { count: 0, lastActivity: null });
    _set(KEYS.BOOKMARKS, []);
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

  // ── Enterprise Recruitment Pipeline Storage ──
  function getHiringDrives() {
    return _get(KEYS.DRIVES) || [];
  }
  function saveHiringDrive(drive) {
    const drives = getHiringDrives();
    const idx = drives.findIndex(d => d.id === drive.id);
    if (idx >= 0) drives[idx] = drive;
    else drives.push(drive);
    _set(KEYS.DRIVES, drives);
  }
  function selfHealCandidateProgress() {
    try {
      const candidates = _get(KEYS.CANDIDATES) || {};
      const interviews = _get(KEYS.INTERVIEWS) || [];
      const drives = getHiringDrives();
      
      let modified = false;
      
      Object.keys(candidates).forEach(email => {
        const cData = candidates[email];
        cData.drivesProgress = cData.drivesProgress || {};
        
        drives.forEach(drive => {
          const progress = cData.drivesProgress[drive.title];
          if (progress) {
            // Find interviews completed by this candidate in this specific drive
            const driveInterviews = interviews.filter(i => {
              const matchesCandidate = (i.email === email || i.candidateName === cData.name || i.regNumber === cData.reg);
              const matchesDrive = i.driveTitle === drive.title;
              return matchesCandidate && matchesDrive;
            });
            
            const hasInProgress = Object.values(progress.roundResults || {}).some(r => r.status === 'in-progress');
            
            // If they have no interviews for this drive, and progress shows they completed rounds, it's legacy cross-pollution!
            if (driveInterviews.length === 0 && !hasInProgress && (progress.shortlistLevel > 1 || Object.keys(progress.roundResults || {}).length > 0)) {
              progress.shortlistLevel = 1;
              progress.roundResults = {};
              progress.status = 'active';
              delete progress.failedRound;
              delete progress.disqualified;
              delete progress.disqualificationReason;
              modified = true;
            }
          }
        });
      });
      
      if (modified) {
        _set(KEYS.CANDIDATES, candidates);
      }
    } catch (e) {
      console.error('Self-healing error:', e);
    }
  }

  function getAllCandidates() {
    selfHealCandidateProgress();
    return Object.values(_get(KEYS.CANDIDATES) || {});
  }

  function getCandidateData(email) {
    const data = _get(KEYS.CANDIDATES) || {};
    const cData = data[email] || { email, shortlistLevel: 1, roundResults: {}, status: 'active', drivesProgress: {} };
    
    // Auto-sync active drive progress to top-level fields for seamless backward compatibility!
    const activeTitle = getActiveDriveTitle();
    cData.drivesProgress = cData.drivesProgress || {};
    if (!cData.drivesProgress[activeTitle]) {
      cData.drivesProgress[activeTitle] = {
        shortlistLevel: cData.shortlistLevel || 1,
        roundResults: cData.roundResults || {},
        status: cData.status || 'active',
        failedRound: cData.failedRound,
        disqualified: cData.disqualified,
        disqualificationReason: cData.disqualificationReason
      };
      // Save it immediately so it persists
      data[email] = cData;
      _set(KEYS.CANDIDATES, data);
    }
    
    const progress = cData.drivesProgress[activeTitle];
    cData.shortlistLevel = progress.shortlistLevel;
    cData.roundResults = progress.roundResults;
    cData.status = progress.status || 'active';
    cData.failedRound = progress.failedRound;
    cData.disqualified = progress.disqualified;
    cData.disqualificationReason = progress.disqualificationReason;
    
    return cData;
  }

  function saveCandidateData(email, cData) {
    const activeTitle = getActiveDriveTitle();
    cData.drivesProgress = cData.drivesProgress || {};
    cData.drivesProgress[activeTitle] = {
      shortlistLevel: cData.shortlistLevel,
      roundResults: cData.roundResults,
      status: cData.status || 'active',
      failedRound: cData.failedRound,
      disqualified: cData.disqualified,
      disqualificationReason: cData.disqualificationReason
    };

    const data = _get(KEYS.CANDIDATES) || {};
    data[email] = cData;
    _set(KEYS.CANDIDATES, data);
  }

  function getActiveDriveTitle() {
    const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('mockai_active_drive') : null;
    if (saved) return saved;
    if (typeof window !== 'undefined' && window._currentDriveTitle) {
      return window._currentDriveTitle;
    }
    const allDrives = getHiringDrives();
    if (allDrives.length > 0) {
      return allDrives[allDrives.length - 1].title;
    }
    return 'Autonomous Hiring Campaign 2026';
  }

  function getCandidateDriveProgress(email, driveTitle) {
    const data = _get(KEYS.CANDIDATES) || {};
    const cData = data[email] || { email, shortlistLevel: 1, roundResults: {}, status: 'active', drivesProgress: {} };
    cData.drivesProgress = cData.drivesProgress || {};
    if (!cData.drivesProgress[driveTitle]) {
      cData.drivesProgress[driveTitle] = {
        shortlistLevel: 1,
        roundResults: {},
        status: 'active'
      };
      data[email] = cData;
      _set(KEYS.CANDIDATES, data);
    }
    return cData.drivesProgress[driveTitle];
  }

  function saveCandidateDriveProgress(email, driveTitle, progress) {
    const data = _get(KEYS.CANDIDATES) || {};
    const cData = data[email] || { email, shortlistLevel: 1, roundResults: {}, status: 'active', drivesProgress: {} };
    cData.drivesProgress = cData.drivesProgress || {};
    cData.drivesProgress[driveTitle] = progress;

    const activeTitle = getActiveDriveTitle();
    if (driveTitle === activeTitle) {
      cData.shortlistLevel = progress.shortlistLevel;
      cData.roundResults = progress.roundResults;
      cData.status = progress.status || 'active';
      cData.failedRound = progress.failedRound;
      cData.disqualified = progress.disqualified;
      cData.disqualificationReason = progress.disqualificationReason;
    }

    data[email] = cData;
    _set(KEYS.CANDIDATES, data);
  }

  function updateCandidateShortlist(email, roundPassed, result) {
    const driveTitle = getActiveDriveTitle();
    const progress = getCandidateDriveProgress(email, driveTitle);
    progress.roundResults[roundPassed] = result;
    progress.shortlistLevel = roundPassed + 1;
    saveCandidateDriveProgress(email, driveTitle, progress);
  }

  return {
    getAllCandidates,
    saveInterview, getInterviews, getInterviewById, deleteInterview, clearAllInterviews,
    getSettings, updateSettings,
    getBookmarks, toggleBookmark, isBookmarked,
    getStreak, updateStreak, getStats,
    exportData, importData,
    getHiringDrives, saveHiringDrive, getCandidateData, saveCandidateData, updateCandidateShortlist,
    getActiveDriveTitle, getCandidateDriveProgress, saveCandidateDriveProgress
  };
})();
