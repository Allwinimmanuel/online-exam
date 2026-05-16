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
    
    // Set initial role UI
    setRole('candidate');
    
    // Initialize Theme
    const savedTheme = localStorage.getItem('mockai_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      const sun = document.getElementById('theme-icon-sun');
      const moon = document.getElementById('theme-icon-moon');
      if(sun) sun.classList.remove('hidden');
      if(moon) moon.classList.add('hidden');
    }

    const loggedIn = sessionStorage.getItem('mockai_logged_in');
    const initialHash = location.hash.slice(1);
    
    if (!loggedIn) {
      navigateTo('login');
    } else {
      const startScreen = initialHash || 'dashboard';
      navigateTo(startScreen);
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
  
  function setRole(role) {
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

    // Update placeholders and input types
    const passLabel = document.getElementById('password-label');
    const passInput = document.getElementById('login-password');
    if (passLabel && passInput) {
      if (role === 'candidate') {
        passLabel.textContent = 'Date of Birth (Password)';
        passInput.type = 'date';
        passInput.placeholder = ''; // Placeholder not needed for type=date
        passInput.style.colorScheme = 'dark'; // Ensure picker is dark
      } else {
        passLabel.textContent = 'Password';
        passInput.type = 'password';
        passInput.placeholder = '••••••••';
      }
    }
  }

  function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const reg = document.getElementById('signup-reg').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const dob = document.getElementById('signup-dob').value.trim();

    if (!name || !reg || !email || !dob) {
      UI.toast('Please fill all fields', 'danger');
      return;
    }

    const users = JSON.parse(localStorage.getItem('mockai_users') || '[]');
    if (users.find(u => u.email === email)) {
      UI.toast('Email already registered', 'warning');
      return;
    }

    users.push({ name, reg, email, dob });
    localStorage.setItem('mockai_users', JSON.stringify(users));
    
    UI.toast('Account created successfully!', 'success');
    
    // Auto-login after signup
    setTimeout(() => {
      sessionStorage.setItem('mockai_logged_in', 'true');
      sessionStorage.setItem('mockai_role', 'candidate');
      sessionStorage.setItem('mockai_user', JSON.stringify({ name, reg, email, dob }));
      
      UI.toast(`Welcome, ${name}!`, 'success');
      document.querySelector('.main-nav').style.display = 'flex';
      _renderDashboard();
      navigateTo('dashboard');
    }, 1000);
  }

  function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    // Date Normalization Helper
    const normalizeDate = (d) => {
      if (!d) return '';
      // If it's already YYYY-MM-DD, keep it
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      // If it's DD-MM-YYYY, convert to YYYY-MM-DD
      const match = d.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
      if (match) return `${match[3]}-${match[2]}-${match[1]}`;
      return d;
    };

    const normalizedPass = normalizeDate(password);

    let isValid = false;
    let userData = null;

    if (window.currentRole === 'interviewer') {
      if (email === 'interviewer@mockai.com' && password === 'admin123') {
        isValid = true;
        userData = { name: 'Admin Interviewer', email };
      }
    } else {
      // CANDIDATE: must have @nec.edu.in email
      if (!email.endsWith('@nec.edu.in')) {
        UI.toast('Candidates must use their @nec.edu.in college email address.', 'danger');
        return;
      }
      // Default demo candidate
      if (email === 'candidate@mockai.com' && (normalizedPass === '2005-03-18' || normalizedPass === '2000-01-01' || password === 'password123')) {
        isValid = true;
        userData = { name: 'Demo Candidate', reg: 'DEMO123', email };
      } else {
        // Check registered users
        const users = JSON.parse(localStorage.getItem('mockai_users') || '[]');
        const user = users.find(u => u.email === email && normalizeDate(u.dob) === normalizedPass);
        if (user) {
          isValid = true;
          userData = { ...user, email };
        }
      }
    }

    if (isValid) {
      UI.toast('Verifying credentials...', 'info');
      setTimeout(() => {
        sessionStorage.setItem('mockai_logged_in', 'true');
        sessionStorage.setItem('mockai_role', window.currentRole);
        sessionStorage.setItem('mockai_user', JSON.stringify(userData));
        
        UI.toast(`Welcome back, ${userData.name}!`, 'success');
        
        // Ensure login screen is hidden immediately
        const loginScreen = document.getElementById('screen-login');
        if (loginScreen) loginScreen.classList.remove('active');
        
        if (window.currentRole === 'interviewer') {
          _renderInterviewerDashboard();
          navigateTo('interviewer-dashboard');
        } else {
          _renderDashboard();
          navigateTo('dashboard');
        }
      }, 800);
    } else {
      const msg = window.currentRole === 'candidate' 
        ? 'Invalid Email or Date of Birth' 
        : 'Invalid Email or Password';
      UI.toast(msg, 'danger');
    }
  }

  function handleLogout() {
    UI.showModal({
      title: 'Confirm Logout',
      content: 'Are you sure you want to logout? You will need to sign in again to access your dashboard.',
      confirmText: 'Logout Now',
      type: 'danger',
      onConfirm: () => {
        // Clear all session markers
        sessionStorage.clear();
        
        // Force redirect to login and reload
        window.location.replace(window.location.pathname + '#login');
        window.location.reload();
      }
    });
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('mockai_theme', isLight ? 'light' : 'dark');
    
    const sun = document.getElementById('theme-icon-sun');
    const moon = document.getElementById('theme-icon-moon');
    
    if (isLight) {
      if(sun) sun.classList.remove('hidden');
      if(moon) moon.classList.add('hidden');
      UI.toast('Light mode activated', 'info');
    } else {
      if(sun) sun.classList.add('hidden');
      if(moon) moon.classList.remove('hidden');
      UI.toast('Dark mode activated', 'info');
    }
  }

  function _renderSidebar() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const role = sessionStorage.getItem('mockai_role') || 'candidate';
    
    if (role === 'candidate') {
      navLinks.innerHTML = `
        <button class="nav-item active" onclick="goTo('dashboard')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Dashboard</button>
        <button class="nav-item" onclick="goTo('candidate-exam')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="2"></rect><path d="M9 12h6M9 16h4"></path></svg> My Exam</button>
        <div style="margin-top: auto; border-top: 1px solid var(--border-primary); padding-top: 16px;">
          <button class="nav-item" onclick="toggleTheme()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Theme</button>
          <button class="nav-item" onclick="handleLogout()" style="color:var(--danger-400)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Logout</button>
        </div>
      `;
    } else {
      navLinks.innerHTML = `
        <button class="nav-item active" onclick="goTo('interviewer-dashboard')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Dashboard</button>
        <button class="nav-item" onclick="goTo('setup')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.87-11.45L21.5 8"></path></svg> Schedule Interview</button>
        <button class="nav-item" onclick="goTo('history')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Reports</button>
        <button class="nav-item" onclick="goTo('settings')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Settings</button>
        <div style="margin-top: auto; border-top: 1px solid var(--border-primary); padding-top: 16px;">
          <button class="nav-item" onclick="toggleTheme()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Theme</button>
          <button class="nav-item" onclick="handleLogout()" style="color:var(--danger-400)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Logout</button>
        </div>
      `;
    }
  }

  function navigateTo(screen) {
    if (!screen || screen === '') screen = 'dashboard';
    
    // Auth Guard
    const loggedIn = sessionStorage.getItem('mockai_logged_in');
    if (!loggedIn && screen !== 'login' && screen !== 'signup') {
      screen = 'login';
      location.hash = 'login';
    }

    // Role-based access control: block candidates from interviewer-only screens
    const role = sessionStorage.getItem('mockai_role') || 'candidate';
    const interviewerOnly = ['interviewer-dashboard', 'history', 'setup'];
    const candidateOnly = ['candidate-exam'];
    
    if (role === 'candidate' && interviewerOnly.includes(screen)) {
      screen = 'candidate-exam';
      location.hash = 'candidate-exam';
    }
    if (role === 'interviewer' && candidateOnly.includes(screen)) {
      screen = 'interviewer-dashboard';
      location.hash = 'interviewer-dashboard';
    }

    _renderSidebar();

    // Remove active from all screens and nav
    const screens = document.querySelectorAll('.screen');
    for (let i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    const navs = document.querySelectorAll('.nav-link, .nav-item');
    for (let i = 0; i < navs.length; i++) navs[i].classList.remove('active');

    const el = document.getElementById('screen-' + screen);
    if (el) {
      el.classList.add('active');
      currentScreen = screen;

      // Control main nav visibility
      const nav = document.querySelector('.main-nav');
      const isAuthScreen = ['login', 'signup', 'verification', 'interview', 'candidate-profile'].includes(screen);
      
      if (nav) {
        if (isAuthScreen || !loggedIn) {
          nav.style.display = 'none';
        } else {
          nav.style.display = 'flex';
          _endInterviewUI();
          
          // Trigger render based on screen
          if (screen === 'dashboard') _renderDashboard();
          if (screen === 'candidate-exam') _renderCandidateExam();
          if (screen === 'interviewer-dashboard') _renderInterviewerDashboard();
          if (screen === 'history') _renderHistory();
        }
      }
    } else {
      // Fallback
      const login = document.getElementById('screen-login');
      if (login) login.classList.add('active');
      currentScreen = 'login';
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
  // ══════════ INTERVIEWER DASHBOARD ══════════
  function _renderInterviewerDashboard() {
    try {
      const list = document.getElementById('interviewer-candidates-list');
      if (!list) return;

      const interviews = Storage.getInterviews() || [];
      
      // Update Global Stats
      const totalCandidates = interviews.length;
      const avgScore = totalCandidates > 0 ? Math.round(interviews.reduce((a, b) => a + (b.score || 0), 0) / totalCandidates) : 0;
      const totalViolations = interviews.reduce((a, b) => a + (b.violations ? b.violations.length : 0), 0);
      const passCount = interviews.filter(i => (i.score || 0) >= 70).length;
      const passRate = totalCandidates > 0 ? Math.round((passCount / totalCandidates) * 100) : 0;

      const statsMap = {
        'interviewer-total-candidates': totalCandidates,
        'interviewer-avg-score': avgScore + '%',
        'interviewer-total-violations': totalViolations,
        'interviewer-pass-rate': passRate + '%'
      };

      Object.entries(statsMap).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      });

      // 2. Ranking / Leaderboard
      const rankingsList = document.getElementById('interviewer-rankings-list');
      if (rankingsList) {
        if (totalCandidates === 0) {
          rankingsList.innerHTML = `<div style="padding:12px; color:var(--text-muted); font-size:13px; text-align:center;">No rankings available yet.</div>`;
        } else {
          const topCandidates = [...interviews].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
          rankingsList.innerHTML = topCandidates.map((c, idx) => {
            const colors = ['#fbbf24', '#cbd5e1', '#b45309', 'var(--text-tertiary)'];
            return `
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--bg-glass); border-radius:var(--radius-md); border-left:4px solid ${colors[idx] || colors[3]}; margin-bottom:8px;">
                <div style="font-size:18px; font-weight:900; color:${colors[idx] || colors[3]}; width:24px;">#${idx + 1}</div>
                <div style="flex:1">
                  <div style="font-weight:600; font-size:14px; color:var(--text-primary);">${c.candidateName || 'Candidate'}</div>
                  <div style="font-size:11px; color:var(--text-tertiary);">${c.domain || 'General'}</div>
                </div>
                <div style="font-family:var(--font-mono); font-weight:800; color:var(--primary-400);">${c.score || 0}%</div>
              </div>
            `;
          }).join('');
        }
      }

      // 3. Performance Chart
      const ctx = document.getElementById('interviewer-performance-chart');
      if (ctx && window.Chart) {
        if (window.performanceChartInstance) window.performanceChartInstance.destroy();
        if (totalCandidates > 0) {
          const labels = interviews.slice(-8).map(i => (i.candidateName || 'N/A').split(' ')[0]);
          const data = interviews.slice(-8).map(i => i.score || 0);
          window.performanceChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Scores',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4
              }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
          });
        }
      }

      // 4. Main Table List
      if (totalCandidates === 0) {
        list.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted);">No candidate reports available yet.</td></tr>`;
      } else {
        list.innerHTML = [...interviews].reverse().map(i => {
          const isTerminated = i.isTerminated || (i.violations && i.violations.some(v => v.type === 'TERMINATED'));
          return `
            <tr style="border-bottom: 1px solid var(--border-primary); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-glass)'" onmouseout="this.style.background='transparent'">
              <td style="padding: 16px;">
                <div style="font-weight: 600; color:var(--text-primary);">${i.candidateName || 'Unknown'}</div>
                <div style="font-size: 11px; color: var(--text-tertiary);">${i.regNumber || 'N/A'} • ${UI.formatDate(i.timestamp)}</div>
              </td>
              <td style="padding: 16px; color:var(--text-secondary);">${i.domain || 'General'}</td>
              <td style="padding: 16px; font-weight: 700; color: var(--primary-400);">${i.score || 0}%</td>
              <td style="padding: 16px;">
                <div style="display:flex; gap:4px;">
                  ${[1, 2, 3, 4].map(idx => `<div style="width:8px; height:8px; border-radius:50%; background: ${idx <= (i.violations ? i.violations.filter(v=>v.type==='STRIKE').length : 0) ? 'var(--danger-500)' : 'var(--bg-tertiary)'}; border: 1px solid var(--border-primary);"></div>`).join('')}
                </div>
              </td>
              <td style="padding: 16px;">
                <span class="badge badge-${isTerminated ? 'danger' : 'success'}">${isTerminated ? 'Terminated' : 'Completed'}</span>
              </td>
              <td style="padding: 16px;">
                <button class="btn btn-ghost btn-sm" onclick="App.viewResult('${i.id}')" style="padding:4px 12px; font-size:12px;">View Report</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error("Interviewer Dashboard Error:", err);
    }
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
    const userData = JSON.parse(sessionStorage.getItem('mockai_user') || '{}');
    const welcomeName = document.getElementById('candidate-welcome-name');
    if (welcomeName) welcomeName.textContent = userData.name || 'Candidate';
  }

  // ══════════ CANDIDATE EXAM VIEW ══════════
  function _renderCandidateExam() {
    const userData = JSON.parse(sessionStorage.getItem('mockai_user') || '{}');
    const container = document.getElementById('candidate-exam-content');
    if (!container) return;

    // Find any active broadcast exam (for all @nec.edu.in students)
    const allScheduled = JSON.parse(localStorage.getItem('mockai_scheduled_exams') || '[]');
    const myExam = allScheduled.find(e => e.type === 'broadcast' && e.status === 'pending');

    if (!myExam) {
      container.innerHTML = `
        <div class="card" style="padding: 48px; text-align: center; border: 2px dashed var(--border-primary);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin: 0 auto 20px;"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
          <h3 style="font-size: 22px; margin-bottom: 8px; color: var(--text-secondary);">No Exam Scheduled</h3>
          <p style="color: var(--text-tertiary);">Your interviewer has not scheduled an exam yet.<br>Please check back later or contact your interviewer.</p>
        </div>`;
      return;
    }

    const difficultyLabel = ['', 'Fresher', 'Intermediate', 'Expert'][myExam.difficulty] || 'Fresher';
    const dateStr = myExam.examDate ? ` • ${myExam.examDate}` : '';
    const timeStr = myExam.examTime ? ` at ${myExam.examTime}` : '';
    container.innerHTML = `
      <div class="card" style="padding: 36px; border: 2px solid rgba(59,130,246,0.3); background: rgba(59,130,246,0.05);">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px;">
          <div style="width:56px; height:56px; border-radius:14px; background: rgba(59,130,246,0.15); display:flex; align-items:center; justify-content:center; color:var(--primary-400);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="2"></rect><path d="M9 12h6M9 16h4"></path></svg>
          </div>
          <div>
            <h3 style="font-size:22px; margin-bottom:4px;">${myExam.title || myExam.domain}</h3>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;">
              <span style="color:var(--success-400); font-size:13px; font-weight:600; background:rgba(34,197,94,0.1); padding:4px 10px; border-radius:20px;">✓ Exam Ready</span>
              <span style="color:var(--primary-300); font-size:13px; background:rgba(59,130,246,0.1); padding:4px 10px; border-radius:20px;">${myExam.round}</span>
              ${dateStr ? `<span style="color:var(--text-muted); font-size:13px;">${dateStr}${timeStr}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:28px;">
          <div style="background:var(--bg-secondary); border-radius:10px; padding:16px; text-align:center;">
            <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;">Difficulty</div>
            <div style="font-size:18px; font-weight:700; color:var(--primary-300);">${difficultyLabel}</div>
          </div>
          <div style="background:var(--bg-secondary); border-radius:10px; padding:16px; text-align:center;">
            <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;">Duration</div>
            <div style="font-size:18px; font-weight:700; color:var(--accent-300);">${myExam.duration} min</div>
          </div>
          <div style="background:var(--bg-secondary); border-radius:10px; padding:16px; text-align:center;">
            <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;">Questions</div>
            <div style="font-size:18px; font-weight:700; color:var(--success-400);">${myExam.questionCount}</div>
          </div>
        </div>
        <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.15); border-radius:10px; padding:14px 18px; margin-bottom:24px; font-size:13px; color:var(--text-secondary);">
          <strong style="color:var(--danger-400);">⚠ Proctoring Active:</strong> Your camera, microphone, and browser activity will be monitored throughout the exam.
        </div>
        <button class="btn btn-primary btn-lg" onclick="joinScheduledExam('${myExam.id}')" style="width:100%; padding:16px; font-size:16px; display:flex; align-items:center; justify-content:center; gap:10px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
          Join Exam Now
        </button>
      </div>`;
  }


  // ══════════ SCHEDULE EXAM (Interviewer) ══════════
  window.selectRound = function(round, el) {
    interviewConfig.round = round;
    const parent = el.parentElement;
    if (parent) parent.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    _updateScheduleSummary();
  };

  window.selectQuestionCount = function(count, el) {
    interviewConfig.questionCount = count;
    const parent = el.parentElement;
    if (parent) parent.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    _updateScheduleSummary();
  };

  function _updateScheduleSummary() {
    const cfg = interviewConfig;
    const diffLabel = ['','Fresher','Intermediate','Expert'][cfg.difficulty] || '—';
    const setT = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    setT('summary-domain', 'Domain: ' + (cfg.domain || '—'));
    setT('summary-round', 'Round: ' + (cfg.round || '—'));
    setT('summary-difficulty', 'Difficulty: ' + diffLabel);
    setT('summary-questions', 'Questions: ' + (cfg.questionCount || 10));
    setT('summary-duration', 'Duration: ' + (cfg.duration || 20) + ' min');
  }

  window.scheduleExamForCandidate = function() {
    if (!interviewConfig.domain) {
      UI.toast('Please select a question domain first.', 'error');
      return;
    }

    const title = (document.getElementById('schedule-exam-title') || {}).value || '';

    const exam = {
      id: 'exam_' + Date.now(),
      type: 'broadcast',          // available to ALL @nec.edu.in students
      title: title.trim() || interviewConfig.domain,
      domain: interviewConfig.domain,
      round: interviewConfig.round || 'Technical Round 1',
      difficulty: interviewConfig.difficulty || 1,
      duration: interviewConfig.duration || 20,
      questionCount: interviewConfig.questionCount || 10,
      examDate: (document.getElementById('schedule-date') || {}).value || '',
      examTime: (document.getElementById('schedule-time') || {}).value || '',
      scheduledAt: new Date().toISOString(),
      status: 'pending'
    };

    // Replace any existing pending broadcast exam
    const existing = JSON.parse(localStorage.getItem('mockai_scheduled_exams') || '[]');
    const filtered = existing.filter(e => !(e.type === 'broadcast' && e.status === 'pending'));
    filtered.push(exam);
    localStorage.setItem('mockai_scheduled_exams', JSON.stringify(filtered));

    UI.toast(`✓ Exam scheduled for all @nec.edu.in students!`, 'success');
    setTimeout(() => navigateTo('interviewer-dashboard'), 1200);
  };

  // ══════════ JOIN SCHEDULED EXAM (Candidate) ══════════
  window.joinScheduledExam = function(examId) {
    const allExams = JSON.parse(localStorage.getItem('mockai_scheduled_exams') || '[]');
    const exam = allExams.find(e => e.id === examId);
    if (!exam) { UI.toast('Exam not found.', 'error'); return; }

    // Load exam config
    interviewConfig = {
      domain: exam.domain,
      difficulty: exam.difficulty,
      duration: exam.duration,
      questionCount: exam.questionCount,
      voiceEnabled: true,
      webcamEnabled: true
    };

    // Mark exam as started
    exam.status = 'started';
    localStorage.setItem('mockai_scheduled_exams', JSON.stringify(allExams));

    startInterview();
  };


  // ══════════ SETUP ══════════
  function _renderSetup() {
    interviewConfig = { domain: '', round: 'Technical Round 1', difficulty: 1, duration: 20, questionCount: 10, voiceEnabled: true, webcamEnabled: true };
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
    _updateScheduleSummary();
  };

  window.selectDifficulty = function (diff) {
    interviewConfig.difficulty = diff;
    document.querySelectorAll('#setup-step-2 .option-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    _updateScheduleSummary();
  };

  window.selectDuration = function (dur) {
    interviewConfig.duration = dur;
    document.querySelectorAll('#setup-step-2 .option-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    _updateScheduleSummary();
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

    // Show Profile Screen first (as requested)
    navigateTo('candidate-profile');
  };

  window.saveProfileAndContinue = function () {
    const name = document.getElementById('cand-name').value.trim();
    const reg = document.getElementById('cand-reg').value.trim();

    if (!name || !reg) {
      UI.toast('Please enter your Name and Register Number', 'warning');
      return;
    }

    interviewConfig.candidateName = name;
    interviewConfig.regNumber = reg;

    // Now go to verification
    navigateTo('verification');
  };

  // Expose to window so verification.js can trigger the real interview start
  window.actuallyStartInterview = function (profile) {
    // Profile is already set in interviewConfig via saveProfileAndContinue, 
    // but we can update it if passed (for redundancy)
    if (profile) {
      interviewConfig.candidateName = profile.name || interviewConfig.candidateName;
      interviewConfig.regNumber = profile.reg || interviewConfig.regNumber;
    }
    
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
    // Explicitly set termination reason in config for InterviewEngine to capture
    interviewConfig.terminationReason = reason;
    interviewConfig.isTerminated = true;

    // 1. Save the session data immediately before shutting down
    InterviewEngine.endEarly(); 
    
    // 2. Shutdown hardware/proctoring
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
      
      if (interviews.length > 0) {
        const textEl = document.getElementById('history-stats-text');
        const containerEl = document.getElementById('history-stats-chart-container');
        if (textEl && containerEl) {
          textEl.style.display = 'none';
          containerEl.style.display = 'block';
          
          // Sort chronologically for trend line
          const sorted = [...interviews].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          const labels = sorted.map((i, index) => `Exam ${index + 1}`);
          const values = sorted.map(i => i.score || 0);
          
          Analytics.drawLineChart('history-stats-chart', labels, values);
        }
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

  return { 
    init, 
    navigateTo, 
    viewResult: _viewResult,
    handleLogin,
    handleSignup,
    handleLogout,
    toggleTheme,
    setRole
  };
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
