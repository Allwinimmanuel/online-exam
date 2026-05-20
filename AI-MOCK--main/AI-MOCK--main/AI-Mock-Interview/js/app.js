/* ============================================
   App Controller — Main Application
   ============================================ */
const App = (() => {
  let currentScreen = "dashboard";
  let interviewConfig = {};
  let currentSessionData = null;
  let selectedCandidateDrive = null;

  function init() {
    Speech.init();
    _setupNavigation();

    // Set initial role UI
    setRole("candidate");

    // Initialize Theme
    const savedTheme = localStorage.getItem("mockai_theme");
    if (savedTheme === "light") {
      document.body.classList.add("light-theme");
      const sun = document.getElementById("theme-icon-sun");
      const moon = document.getElementById("theme-icon-moon");
      if (sun) sun.classList.remove("hidden");
      if (moon) moon.classList.add("hidden");
    }

    const loggedIn = sessionStorage.getItem("mockai_logged_in");
    const initialHash = location.hash.slice(1);

    if (!loggedIn) {
      navigateTo("login");
    } else {
      const startScreen = initialHash || "dashboard";
      navigateTo(startScreen);
    }

    // Handle hash routing
    window.addEventListener("hashchange", () => {
      const hash = location.hash.slice(1) || "dashboard";
      if (!sessionStorage.getItem("mockai_logged_in") && hash !== "login") {
        navigateTo("login");
      } else {
        navigateTo(hash);
      }
    });
  }

  window.currentRole = "candidate"; // default

  function setRole(role) {
    window.currentRole = role;
    // Update UI buttons
    document.querySelectorAll(".role-btn").forEach((btn) => {
      btn.classList.remove("active");
      btn.style.background = "transparent";
      btn.style.color = "var(--text-muted)";
    });
    const activeBtn = document.getElementById("role-" + role + "-btn");
    if (activeBtn) {
      activeBtn.classList.add("active");
      activeBtn.style.background = "var(--primary-500)";
      activeBtn.style.color = "white";
    }

    // Update placeholders and input types
    const passLabel = document.getElementById("password-label");
    const passInput = document.getElementById("login-password");
    if (passLabel && passInput) {
      if (role === "candidate") {
        passLabel.textContent = "Date of Birth (Password)";
        passInput.type = "date";
        passInput.placeholder = ""; // Placeholder not needed for type=date
        passInput.style.colorScheme = "dark"; // Ensure picker is dark
      } else {
        passLabel.textContent = "Password";
        passInput.type = "password";
        passInput.placeholder = "••••••••";
      }
    }
  }

  function handleSignup() {
    const name = document.getElementById("signup-name").value.trim();
    const reg = document.getElementById("signup-reg").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const dob = document.getElementById("signup-dob").value.trim();

    if (!name || !reg || !email || !dob) {
      UI.toast("Please fill all fields", "danger");
      return;
    }

    const users = JSON.parse(localStorage.getItem("mockai_users") || "[]");
    if (users.find((u) => u.email === email)) {
      UI.toast("Email already registered", "warning");
      return;
    }

    users.push({ name, reg, email, dob });
    localStorage.setItem("mockai_users", JSON.stringify(users));

    UI.toast("Account created successfully!", "success");

    // Auto-login after signup
    setTimeout(() => {
      sessionStorage.setItem("mockai_logged_in", "true");
      sessionStorage.setItem("mockai_role", "candidate");
      sessionStorage.setItem(
        "mockai_user",
        JSON.stringify({ name, reg, email, dob }),
      );

      // Initialize candidate status in mockInterview_candidates immediately
      const cData = Storage.getCandidateData(email) || {};
      cData.email = email;
      cData.name = name;
      cData.reg = reg;
      cData.dob = dob;
      cData.status = cData.status || "active";
      cData.shortlistLevel = cData.shortlistLevel || 1;
      cData.roundResults = cData.roundResults || {};
      Storage.saveCandidateData(email, cData);

      UI.toast(`Welcome, ${name}!`, "success");
      document.querySelector(".main-nav").style.display = "flex";
      _renderDashboard();
      navigateTo("dashboard");
    }, 1000);
  }

  function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    // Date Normalization Helper
    const normalizeDate = (d) => {
      if (!d) return "";
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

    if (window.currentRole === "interviewer") {
      if (email === "interviewer@mockai.com" && password === "admin123") {
        isValid = true;
        userData = { name: "Admin Interviewer", email };
      }
    } else {
      // CANDIDATE: must have @nec.edu.in email
      if (!email.endsWith("@nec.edu.in")) {
        UI.toast(
          "Candidates must use their @nec.edu.in college email address.",
          "danger",
        );
        return;
      }
      // Default demo candidate
      if (
        email === "candidate@mockai.com" &&
        (normalizedPass === "2005-03-18" ||
          normalizedPass === "2000-01-01" ||
          password === "password123")
      ) {
        isValid = true;
        userData = { name: "Demo Candidate", reg: "DEMO123", email };
      } else {
        // Check registered users
        const users = JSON.parse(localStorage.getItem("mockai_users") || "[]");
        const user = users.find(
          (u) => u.email === email && normalizeDate(u.dob) === normalizedPass,
        );
        if (user) {
          isValid = true;
          userData = { ...user, email };
        }
      }
    }

    if (isValid) {
      UI.toast("Verifying credentials...", "info");
      setTimeout(() => {
        sessionStorage.setItem("mockai_logged_in", "true");
        sessionStorage.setItem("mockai_role", window.currentRole);
        sessionStorage.setItem("mockai_user", JSON.stringify(userData));

        if (window.currentRole === "candidate") {
          const cData = Storage.getCandidateData(userData.email) || {};
          cData.email = userData.email;
          cData.name = userData.name;
          cData.reg = userData.reg || "DEMO123";
          cData.status = cData.status || "active";
          cData.shortlistLevel = cData.shortlistLevel || 1;
          cData.roundResults = cData.roundResults || {};
          Storage.saveCandidateData(userData.email, cData);
        }

        UI.toast(`Welcome back, ${userData.name}!`, "success");

        // Ensure login screen is hidden immediately
        const loginScreen = document.getElementById("screen-login");
        if (loginScreen) loginScreen.classList.remove("active");

        if (window.currentRole === "interviewer") {
          _renderInterviewerDashboard();
          navigateTo("interviewer-dashboard");
        } else {
          _renderDashboard();
          navigateTo("dashboard");
        }
      }, 800);
    } else {
      const msg =
        window.currentRole === "candidate"
          ? "Invalid Email or Date of Birth"
          : "Invalid Email or Password";
      UI.toast(msg, "danger");
    }
  }

  function handleLogout() {
    UI.showModal({
      title: "Confirm Logout",
      content:
        "Are you sure you want to logout? You will need to sign in again to access your dashboard.",
      confirmText: "Logout Now",
      type: "danger",
      onConfirm: () => {
        // Clear all session markers
        sessionStorage.clear();

        // Force redirect to login and reload
        window.location.replace(window.location.pathname + "#login");
        window.location.reload();
      },
    });
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem("mockai_theme", isLight ? "light" : "dark");

    const sun = document.getElementById("theme-icon-sun");
    const moon = document.getElementById("theme-icon-moon");

    if (isLight) {
      if (sun) sun.classList.remove("hidden");
      if (moon) moon.classList.add("hidden");
      UI.toast("Light mode activated", "info");
    } else {
      if (sun) sun.classList.add("hidden");
      if (moon) moon.classList.remove("hidden");
      UI.toast("Dark mode activated", "info");
    }
  }

  function _renderSidebar() {
    const navLinks = document.querySelector(".nav-links");
    if (!navLinks) return;

    const role = sessionStorage.getItem("mockai_role") || "candidate";

    if (role === "candidate") {
      navLinks.innerHTML = `
        <button class="nav-item nav-link" data-screen="dashboard" onclick="goTo('dashboard')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Dashboard</button>
        <button class="nav-item nav-link" data-screen="candidate-exam" onclick="goTo('candidate-exam')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="2"></rect><path d="M9 12h6M9 16h4"></path></svg> My Exam</button>
        <div style="margin-top: auto; border-top: 1px solid var(--border-primary); padding-top: 16px;">
          <button class="nav-item" onclick="toggleTheme()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Theme</button>
          <button class="nav-item" onclick="handleLogout()" style="color:var(--danger-400)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Logout</button>
        </div>
      `;
    } else {
      navLinks.innerHTML = `
        <button class="nav-item nav-link" data-screen="interviewer-dashboard" onclick="goTo('interviewer-dashboard')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Dashboard</button>
        <button class="nav-item nav-link" data-screen="setup" onclick="goTo('setup')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.87-11.45L21.5 8"></path></svg> Schedule Interview</button>
        <button class="nav-item nav-link" data-screen="history" onclick="goTo('history')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Reports</button>
        <button class="nav-item nav-link" data-screen="settings" onclick="goTo('settings')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Settings</button>
        <div style="margin-top: auto; border-top: 1px solid var(--border-primary); padding-top: 16px;">
          <button class="nav-item" onclick="toggleTheme()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Theme</button>
          <button class="nav-item" onclick="handleLogout()" style="color:var(--danger-400)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Logout</button>
        </div>
      `;
    }
  }

  function isCandidateAuthorizedForRound(num) {
    const role = sessionStorage.getItem("mockai_role") || "candidate";
    if (role !== "candidate") return true;

    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const email = userData.email || "candidate@mockai.com";

    // Developer & Testing Override: Always authorize default candidate accounts
    // to allow unrestricted local testing of all 5 rounds without database schedule blocks.
    if (
      email === "candidate@mockai.com" ||
      email.includes("mockai.com") ||
      window._bypassExamAuth
    ) {
      const cData = Storage.getCandidateData(email);
      if (cData.shortlistLevel !== num) {
        cData.shortlistLevel = num;
        Storage.saveCandidateData(email, cData);
      }
      return true;
    }

    const cData = Storage.getCandidateData(email);

    if (cData.roundResults && cData.roundResults[num] !== undefined) {
      const existing = cData.roundResults[num];
      const st = existing.status;
      // Only block if genuinely finished or terminated —
      // 'in-progress' means the exam was interrupted (bug/crash), allow re-entry
      if (st === "completed" || st === "terminated") {
        UI.toast(
          `Round ${num} is already completed. Reattempts are strictly not allowed.`,
          "error",
        );
        return false;
      }
    }

    if (cData.status === "rejected") {
      // Only block if this specific round was formally terminated (not a bug-caused rejection)
      const roundRes = cData.roundResults && cData.roundResults[num];
      const isTerminated = roundRes && roundRes.status === "terminated";
      if (isTerminated) {
        UI.toast(
          "This round was terminated due to violations. Re-attempts are not allowed.",
          "error",
        );
        return false;
      }
      // Otherwise let them proceed (status may have been set by a false-positive bug)
    }

    const roundToStart = cData.shortlistLevel || 1;
    if (num !== roundToStart) {
      UI.toast(
        `Unauthorized access! Your active pending round is Round ${roundToStart}.`,
        "error",
      );
      return false;
    }

    const activeDriveTitle = Storage.getActiveDriveTitle();
    const allDrives = Storage.getHiringDrives();
    const activeDrive =
      allDrives.find((d) => d.title === activeDriveTitle) ||
      (allDrives.length > 0 ? allDrives[allDrives.length - 1] : null);
    const isAllocated =
      activeDrive &&
      activeDrive.rounds &&
      activeDrive.rounds[num - 1] !== undefined;
    if (!isAllocated) {
      UI.toast(
        `Round ${num} has not been scheduled or allocated by the recruiter yet.`,
        "warning",
      );
      return false;
    }

    // --- Strictly Enforce Date & Time Schedule Window ---
    const rCfg = activeDrive.rounds[num - 1];
    const dateParts = rCfg.date.split("-");
    const timeParts = rCfg.time.split(":");
    const schedStart = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      parseInt(timeParts[0]),
      parseInt(timeParts[1]),
    );

    let schedEnd;
    if (rCfg.endDate && rCfg.endTime) {
      const endParts = rCfg.endDate.split("-");
      const endTimeParts = rCfg.endTime.split(":");
      schedEnd = new Date(
        parseInt(endParts[0]),
        parseInt(endParts[1]) - 1,
        parseInt(endParts[2]),
        parseInt(endTimeParts[0]),
        parseInt(endTimeParts[1]),
      );
    } else {
      const durationMins = rCfg.duration || 30;
      schedEnd = new Date(schedStart.getTime() + durationMins * 60000);
    }

    const now = new Date();

    if (now < schedStart) {
      UI.toast("This round has not started yet.", "warning");
      return false;
    }
    if (now > schedEnd) {
      UI.toast("The deadline for this round has expired.", "error");
      return false;
    }

    return true;
  }

  function navigateTo(screen) {
    if (!screen || screen === "") screen = "dashboard";

    // Auth Guard
    const loggedIn = sessionStorage.getItem("mockai_logged_in");
    if (!loggedIn && screen !== "login" && screen !== "signup") {
      screen = "login";
      location.hash = "login";
    }

    // Role-based access control: block candidates from interviewer-only screens
    const role = sessionStorage.getItem("mockai_role") || "candidate";
    const interviewerOnly = ["interviewer-dashboard", "history", "setup"];
    const candidateOnly = ["candidate-exam"];

    if (role === "candidate" && interviewerOnly.includes(screen)) {
      screen = "candidate-exam";
      location.hash = "candidate-exam";
    }
    if (role === "interviewer" && candidateOnly.includes(screen)) {
      screen = "interviewer-dashboard";
      location.hash = "interviewer-dashboard";
    }

    // Strictly enforce Candidate Round Rules
    if (role === "candidate") {
      const examScreens = [
        "system-check",
        "aptitude",
        "coding",
        "resume-upload",
        "interview",
      ];
      if (examScreens.includes(screen)) {
        // _launchRound sets this flag to bypass the re-check after saving in-progress record
        if (window._bypassExamAuth) {
          window._bypassExamAuth = false;
          // Allow navigation — called internally from _launchRound after fullscreen granted
        } else {
          if (["aptitude", "coding", "interview"].includes(screen)) {
            if (
              sessionStorage.getItem("mockai_verification_passed") !== "true"
            ) {
              UI.toast(
                "Verification and fullscreen are strictly mandatory. Please complete diagnostics first.",
                "error",
              );
              location.hash = "system-check";
              return;
            }
          }

          const userData = JSON.parse(
            sessionStorage.getItem("mockai_user") || "{}",
          );
          const email = userData.email || "candidate@mockai.com";
          const cData = Storage.getCandidateData(email);
          const activeRound = cData.shortlistLevel || 1;

          let roundNum = 0;
          if (screen === "aptitude") {
            roundNum = 1;
          } else if (screen === "coding") {
            roundNum = 2;
          } else if (screen === "resume-upload") {
            roundNum = 5;
          } else if (screen === "interview") {
            roundNum = activeRound === 3 || activeRound === 4 ? activeRound : 3;
          } else if (screen === "system-check") {
            roundNum = window._pendingRoundNum || activeRound;
          }

          window._pendingRoundNum = roundNum;

          if (!isCandidateAuthorizedForRound(roundNum)) {
            location.hash = "candidate-exam";
            return;
          }
        }
      }
    }

    _renderSidebar();

    // Remove active from all screens and nav
    const screens = document.querySelectorAll(".screen");
    for (let i = 0; i < screens.length; i++)
      screens[i].classList.remove("active");
    const navs = document.querySelectorAll(".nav-link, .nav-item");
    for (let i = 0; i < navs.length; i++) navs[i].classList.remove("active");

    const el = document.getElementById("screen-" + screen);
    if (el) {
      el.classList.add("active");
      currentScreen = screen;

      // Control main nav visibility
      const nav = document.querySelector(".main-nav");
      const isAuthScreen = [
        "login",
        "signup",
        "system-check",
        "interview",
        "candidate-profile",
      ].includes(screen);

      if (nav) {
        if (isAuthScreen || !loggedIn) {
          nav.style.display = "none";
        } else {
          nav.style.display = "flex";
          _endInterviewUI();

          // Trigger render based on screen
          if (screen === "dashboard") _renderDashboard();
          if (screen === "candidate-exam") _renderCandidateExam();
          if (screen === "interviewer-dashboard") _renderInterviewerDashboard();
          if (screen === "history") _renderHistory();
        }
      }
    } else {
      // Fallback
      const login = document.getElementById("screen-login");
      if (login) login.classList.add("active");
      currentScreen = "login";
    }

    const navLink = document.querySelector(
      '.nav-link[data-screen="' + screen + '"]',
    );
    if (navLink) navLink.classList.add("active");

    // Scroll to top
    window.scrollTo(0, 0);

    // Render screen content
    switch (screen) {
      case "dashboard":
        _renderDashboard();
        break;
      case "interviewer-dashboard":
        _renderInterviewerDashboard();
        break;
      case "setup":
        _renderSetup();
        break;
      case "history":
        _renderHistory();
        break;
      case "practice":
        _renderPractice();
        break;
      case "settings":
        _renderSettings();
        break;
      case "aptitude":
        break;
      case "coding":
        break;
      case "system-check":
        _runSystemCheck();
        break;
      case "resume-upload":
        break;
    }
  }

  function _setupNavigation() {
    document.querySelectorAll(".nav-link").forEach(function (link) {
      link.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var screen = this.getAttribute("data-screen");
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
      const list = document.getElementById("interviewer-candidates-list");
      if (!list) return;

      const interviews = Storage.getInterviews() || [];

      // Update Global Stats (Unique Candidates validation check)
      const totalSessions = interviews.length;
      const uniqueRegs = new Set(
        interviews.map((i) => i.regNumber || i.candidateName || i.id),
      );
      const totalCandidates = uniqueRegs.size;
      const avgScore =
        totalSessions > 0
          ? Math.round(
              interviews.reduce((a, b) => a + (b.score || 0), 0) /
                totalSessions,
            )
          : 0;
      const totalViolations = interviews.reduce(
        (a, b) => a + (b.violations ? b.violations.length : 0),
        0,
      );
      const passCount = interviews.filter((i) => (i.score || 0) >= 70).length;
      const passRate =
        totalSessions > 0 ? Math.round((passCount / totalSessions) * 100) : 0;

      const statsMap = {
        "interviewer-total-candidates": totalCandidates,
        "interviewer-avg-score": avgScore + "%",
        "interviewer-total-violations": totalViolations,
        "interviewer-pass-rate": passRate + "%",
      };

      Object.entries(statsMap).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      });

      // 2. Ranking / Leaderboard
      const rankingsList = document.getElementById("interviewer-rankings-list");
      if (rankingsList) {
        if (totalCandidates === 0) {
          rankingsList.innerHTML = `<div style="padding:12px; color:var(--text-muted); font-size:13px; text-align:center;">No rankings available yet.</div>`;
        } else {
          const topCandidates = [...interviews]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 5);
          rankingsList.innerHTML = topCandidates
            .map((c, idx) => {
              const colors = [
                "#fbbf24",
                "#cbd5e1",
                "#b45309",
                "var(--text-tertiary)",
              ];
              return `
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--bg-glass); border-radius:var(--radius-md); border-left:4px solid ${colors[idx] || colors[3]}; margin-bottom:8px;">
                <div style="font-size:18px; font-weight:900; color:${colors[idx] || colors[3]}; width:24px;">#${idx + 1}</div>
                <div style="flex:1">
                  <div style="font-weight:600; font-size:14px; color:var(--text-primary);">${c.candidateName || "Candidate"}</div>
                  <div style="font-size:11px; color:var(--text-tertiary);">${c.domain || "General"}</div>
                </div>
                <div style="font-family:var(--font-mono); font-weight:800; color:var(--primary-400);">${c.score || 0}%</div>
              </div>
            `;
            })
            .join("");
        }
      }

      // 3. Performance Chart
      const ctx = document.getElementById("interviewer-performance-chart");
      if (ctx && window.Chart) {
        if (window.performanceChartInstance)
          window.performanceChartInstance.destroy();
        if (totalCandidates > 0) {
          const labels = interviews
            .slice(-8)
            .map((i) => (i.candidateName || "N/A").split(" ")[0]);
          const data = interviews.slice(-8).map((i) => i.score || 0);
          window.performanceChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
              labels: labels,
              datasets: [
                {
                  label: "Scores",
                  data: data,
                  backgroundColor: "rgba(59, 130, 246, 0.5)",
                  borderColor: "rgba(59, 130, 246, 1)",
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, max: 100 } },
            },
          });
        }
      }

      // 4. Main Table List
      if (totalCandidates === 0) {
        list.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted);">No candidate reports available yet.</td></tr>`;
      } else {
        list.innerHTML = [...interviews]
          .reverse()
          .map((i) => {
            const strikeViolations = i.violations
              ? i.violations.filter((v) => v.type === "STRIKE")
              : [];
            const strikeCount = Math.min(3, strikeViolations.length);
            const isTerminated = i.isTerminated || strikeCount >= 3;

            let lastViolationName = "None";
            if (strikeViolations.length > 0) {
              const lastV = strikeViolations[strikeViolations.length - 1];
              lastViolationName =
                lastV.reason || lastV.type || "Malpractice Action";
              lastViolationName = lastViolationName
                .replace("DISQUALIFIED: ", "")
                .replace("STRIKE: ", "");
            }
            const statusText = isTerminated
              ? "Terminated"
              : strikeCount > 0
                ? "Exam Continued"
                : "Clean Session";
            const tooltipText = `${strikeCount} Security Warning${strikeCount !== 1 ? "s" : ""} Detected\nLast Violation: ${lastViolationName}\nStatus: ${statusText}`;

            return `
            <tr style="border-bottom: 1px solid var(--border-primary); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-glass)'" onmouseout="this.style.background='transparent'">
               <td style="padding: 16px;">
                 <div style="font-weight: 600; color:var(--text-primary);">${i.candidateName || "Unknown"}</div>
                 <div style="font-size: 11px; color: var(--text-tertiary);">${i.regNumber || "N/A"} • ${UI.formatDate(i.timestamp)}</div>
               </td>
               <td style="padding: 16px; color:var(--text-secondary);">${i.domain || "General"}</td>
               <td style="padding: 16px; font-weight: 700; color: var(--primary-400);">${i.score || 0}%</td>
               <td style="padding: 16px;">
                 <div style="display:flex; gap:6px; cursor:help;" title="${tooltipText}">
                   ${[1, 2, 3]
                     .map((idx) => {
                       const isRed = idx <= strikeCount;
                       return `<div style="width:10px; height:10px; border-radius:50%; background: ${isRed ? "#ef4444" : "rgba(255,255,255,0.15)"}; border: 1px solid ${isRed ? "#ef4444" : "rgba(255,255,255,0.25)"}; transition: background 0.3s ease, border-color 0.3s ease; box-shadow: ${isRed ? "0 0 8px rgba(239, 68, 68, 0.5)" : "none"};"></div>`;
                     })
                     .join("")}
                 </div>
               </td>
               <td style="padding: 16px;">
                 <span class="badge badge-${isTerminated ? "danger" : "success"}">${isTerminated ? "Terminated" : "Completed"}</span>
               </td>
               <td style="padding: 16px;">
                 <button class="btn btn-ghost btn-sm" onclick="App.viewResult('${i.id}')" style="padding:4px 12px; font-size:12px;">View Report</button>
               </td>
            </tr>
          `;
          })
          .join("");
      }
      _renderPipelineLeaderboard();
      _renderInterviewerDrives();
    } catch (err) {
      console.error("Interviewer Dashboard Error:", err);
    }
  }

  window.generateInterviewerReport = function (id) {
    const interviews = Storage.getInterviews();
    const sessionData = interviews.find((i) => i.id === id);
    if (sessionData && sessionData.analysis) {
      PDFReport.generate(sessionData);
      UI.toast("Report Generated", "success");
    } else {
      UI.toast("Report data not fully available", "error");
    }
  };

  // ══════════ DASHBOARD ══════════
  function _renderDashboard() {
    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const welcomeName = document.getElementById("candidate-welcome-name");
    if (welcomeName) welcomeName.textContent = userData.name || "Candidate";

    _renderCandidateExam();
  }

  // ══════════ CANDIDATE EXAM VIEW (PIPELINE) ══════════
  function _selectCandidateDrive(title) {
    selectedCandidateDrive = title;
    _renderCandidateExam();
  }

  function _deselectCandidateDrive() {
    selectedCandidateDrive = null;
    _renderCandidateExam();
  }

  function _renderCandidateExam() {
    const container = document.getElementById("candidate-exam-content");
    if (!container) return;

    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const email = userData.email || "candidate@mockai.com";

    let allDrives = Storage.getHiringDrives();
    if (allDrives.length === 0) {
      // Auto-create a default drive for instant first-use setup
      const defaultDrive = {
        id: "default-drive",
        title: "Autonomous Hiring Campaign 2026",
        date: new Date().toISOString().split("T")[0],
        rounds: [
          {
            num: 1,
            topics: ["Quantitative Aptitude", "Logical Reasoning"],
            duration: 30,
            count: 15,
            positiveMarks: 4,
            negativeEnabled: true,
            negativeMarks: -1,
            camera: false,
            webcamEnabled: false,
          },
          {
            num: 2,
            topics: ["Dynamic Programming & DSA"],
            duration: 90,
            count: 2,
            camera: false,
            webcamEnabled: false,
          },
          {
            num: 3,
            topics: ["System Design", "React/Angular/Node"],
            duration: 20,
            count: 8,
            camera: true,
            webcamEnabled: true,
            systemCheck: true,
          },
          {
            num: 4,
            topics: ["Self Introduction", "Extempore / Impromptu"],
            duration: 15,
            count: 3,
            camera: true,
            webcamEnabled: true,
            systemCheck: true,
          },
          {
            num: 5,
            topics: ["Behavioral Questions", "Cultural Fit"],
            duration: 15,
            count: 6,
            camera: true,
            webcamEnabled: true,
            systemCheck: true,
            resumeRequired: true,
          },
        ],
      };
      Storage.saveHiringDrive(defaultDrive);
      allDrives = [defaultDrive];
    }

    const rounds = [
      {
        num: 1,
        id: "aptitude",
        title: "Aptitude Test",
        defTopic: "Logical Reasoning & Quantitative Aptitude",
        defDur: 30,
      },
      {
        num: 2,
        id: "coding",
        title: "Coding Assessment",
        defTopic: "Dynamic Programming & Data Structures",
        defDur: 90,
      },
      {
        num: 3,
        id: "technical",
        title: "Spoken Technical Interview",
        defTopic: "Fullstack, DOM, React, APIs",
        defDur: 20,
      },
      {
        num: 4,
        id: "communication",
        title: "Communication Evaluation",
        defTopic: "Communication, Confidence, Fluency",
        defDur: 15,
      },
      {
        num: 5,
        id: "hr",
        title: "HR & Behavioral",
        defTopic: "HR Scenario Questions",
        defDur: 15,
      },
    ];

    // If NO drive is selected, render the drives grid!
    if (
      !selectedCandidateDrive ||
      !allDrives.find((d) => d.title === selectedCandidateDrive)
    ) {
      let gridHtml = `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px; margin-top:10px;">
      `;

      gridHtml += allDrives
        .map((drive) => {
          const progress = Storage.getCandidateDriveProgress(
            email,
            drive.title,
          );
          const shortlistLvl = progress.shortlistLevel || 1;
          const status = progress.status || "active";

          let statusLabel = "Scheduled";
          let statusClass = "warning";

          if (status === "rejected" || progress.disqualified) {
            statusLabel = "Terminated";
            statusClass = "danger";
          } else if (shortlistLvl > 5) {
            statusLabel = "Completed";
            statusClass = "success";
          } else if (shortlistLvl > 1) {
            statusLabel = "Ongoing";
            statusClass = "primary";
          }

          let activeRoundName = "Round 1: Aptitude";
          if (shortlistLvl > 5) {
            activeRoundName = "Completed";
          } else {
            activeRoundName = `Round ${shortlistLvl}: ${rounds[shortlistLvl - 1].title}`;
          }

          const compPercent = Math.round(
            (Math.min(5, shortlistLvl - 1) / 5) * 100,
          );

          return `
          <div class="card card-interactive" style="padding: 20px; display:flex; flex-direction:column; gap:16px; border: 1px solid var(--border-primary); position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%); min-height: 280px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <h4 style="font-size: 16px; font-weight:700; color:var(--text-primary); margin-bottom: 4px;">${drive.title}</h4>
                <span class="badge badge-${statusClass}" style="margin-top: 6px; display: inline-block;">${statusLabel}</span>
              </div>
            </div>
            
            <p style="font-size: 12px; color:var(--text-tertiary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; min-height: 34px; margin: 0;">
              ${drive.desc || "No description provided."}
            </p>

            <div style="display:grid; grid-template-columns: 1fr; gap:12px; border-top: 1px solid var(--border-primary); padding-top: 12px;">
              <div>
                <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing:0.5px;">Active Round</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-secondary); margin-top:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🏁 ${activeRoundName}</div>
              </div>
              <div>
                <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing:0.5px; display:flex; justify-content:space-between;">
                  <span>Completion Status</span>
                  <span>${compPercent}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; margin-top: 6px; overflow: hidden;">
                  <div style="width: ${compPercent}%; height: 100%; background: var(--success-500); border-radius: 3px; transition: width 0.3s;"></div>
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid var(--border-primary); padding-top: 12px; margin-top: auto;">
              <span style="font-size: 11px; color: var(--text-tertiary);">📅 ${drive.date}</span>
              <button onclick="App.selectCandidateDrive('${drive.title.replace(/'/g, "\\'")}')" class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size: 12px;">
                Enter Drive →
              </button>
            </div>
          </div>
        `;
        })
        .join("");

      gridHtml += `</div>`;
      container.innerHTML = gridHtml;
      return;
    }

    // A specific drive is selected — render the detailed 5-round checklist!
    const drive = allDrives.find((d) => d.title === selectedCandidateDrive);
    const progress = Storage.getCandidateDriveProgress(email, drive.title);
    const shortlistLvl = progress.shortlistLevel || 1;
    const status = progress.status || "active";
    const roundResults = progress.roundResults || {};

    const isTerminated = status === "rejected" || progress.disqualified;
    const isCompleted = shortlistLvl > 5;

    let html = `
      <button onclick="App.deselectCandidateDrive()" class="btn btn-secondary btn-sm" style="margin-bottom: 24px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px;">
        ← Back to Recruitment Drives
      </button>
    `;

    if (isTerminated || isCompleted) {
      html += `
        <div style="background:var(--bg-tertiary); border:1px solid var(--border-primary); border-radius:12px; padding:32px; text-align:center; margin-bottom:24px;">
          <h3 style="margin-bottom:12px; color:${isCompleted ? "var(--success-400)" : "var(--danger-400)"};">
            ${isCompleted ? "Drive Completed 🎉" : "Drive Terminated ⚠️"}
          </h3>
          <div style="font-weight:bold; margin-bottom: 8px;">${drive.title}</div>
          <p style="color:var(--text-secondary); margin-bottom:24px;">
            ${isCompleted ? "You have successfully completed all rounds for this recruitment drive. HR will reach out to you shortly." : "Your session for this drive was terminated. You cannot proceed further in this recruitment drive."}
          </p>
          ${progress.disqualificationReason ? `<p style="color:var(--danger-400); font-size:14px; margin-bottom:16px;">Reason: ${progress.disqualificationReason}</p>` : ""}
        </div>
      `;
      container.innerHTML = html;
      return;
    }

    let driveHeaderHtml = "";
    if (status === "rejected" || progress.disqualified) {
      driveHeaderHtml = `
        <div class="card" style="background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(30,41,59,0.4) 100%); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align:center;">
          <h4 style="color:var(--danger-400); font-size:18px; font-weight:700; margin-bottom:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            Assessment Concluded
          </h4>
          <p style="color:var(--text-secondary); font-size:13px; margin:0 auto; line-height:1.5;">
            ${progress.disqualified ? `Disqualified due to severe proctoring violations: <strong style="color:var(--danger-300);">${progress.disqualificationReason || "Multiple tab switching or device removal activity."}</strong>` : "We appreciate your time and participation. However, you did not qualify for the next round of this active hiring drive."}
          </p>
        </div>
      `;
    }

    let roundsHtml = rounds
      .map((r) => {
        const isAllocated =
          drive && drive.rounds && drive.rounds[r.num - 1] !== undefined;
        const isCompleted =
          shortlistLvl > r.num ||
          (roundResults && roundResults[r.num] !== undefined);

        let isUnlocked = false;
        let isCurrent = false;
        let statusBadge = "";

        if (status === "rejected") {
          isUnlocked = isCompleted;
          statusBadge = isCompleted
            ? '<span class="badge badge-success">Completed</span>'
            : '<span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">🔒 Locked</span>';
        } else if (isCompleted) {
          isUnlocked = true;
          statusBadge = '<span class="badge badge-success">Completed</span>';
        } else if (shortlistLvl === r.num) {
          if (isAllocated) {
            isUnlocked = true;
            isCurrent = true;
            statusBadge = '<span class="badge badge-primary">⏳ Ready</span>';
          } else {
            isUnlocked = false;
            statusBadge =
              '<span class="badge" style="background:rgba(245,158,11,0.1); color:var(--warning-400); border:1px solid rgba(245,158,11,0.2);">🔒 Awaiting Allocation</span>';
          }
        } else {
          isUnlocked = false;
          statusBadge =
            '<span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">🔒 Locked</span>';
        }

        const rawTopics =
          drive?.rounds?.[r.num - 1]?.topics ||
          (drive?.rounds?.[r.num - 1]?.topic
            ? [drive?.rounds?.[r.num - 1]?.topic]
            : []);
        const configTopic =
          rawTopics.length > 0 ? rawTopics.join(", ") : r.defTopic;
        const configDur = drive?.rounds?.[r.num - 1]?.duration || r.defDur;
        const cfgDate = drive?.rounds?.[r.num - 1]?.date;
        const cfgTime = drive?.rounds?.[r.num - 1]?.time;
        const cfgEndDate = drive?.rounds?.[r.num - 1]?.endDate;
        const cfgEndTime = drive?.rounds?.[r.num - 1]?.endTime;

        let scheduleStr = "";
        if (cfgDate) {
          scheduleStr = `
          <div style="font-size: 12px; color: var(--accent-400); margin-top: 6px; font-weight:600; display: flex; flex-direction: column; gap: 2px;">
            <div>📅 Start: ${cfgDate} ${cfgTime || ""}</div>
            <div>⏰ Deadline: ${cfgEndDate || ""} ${cfgEndTime || ""}</div>
          </div>
        `;
        }

        return `
        <div style="display:flex; align-items:flex-start; padding: 16px 20px; background: rgba(15,23,42,0.4); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; gap: 16px; opacity: ${isUnlocked ? "1" : "0.5"}; margin-bottom: 12px; transition: all 0.2s;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isCurrent ? "var(--primary-500)" : "rgba(255,255,255,0.05)"}; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 13px; color: ${isCurrent ? "#fff" : "var(--text-muted)"}; margin-top: 2px;">
            ${r.num}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px; color: var(--text-primary);">${r.title}</div>
            <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 2px;">Topic: ${configTopic}</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">Duration: ${configDur} mins</div>
            ${scheduleStr}
          </div>
          <div style="margin-top: 2px;">${statusBadge}</div>
        </div>
      `;
      })
      .join("");

    let btnText = "Enter Next Pending Round →";
    let btnDisabled = false;

    const roundToStart = shortlistLvl || 1;
    if (status === "rejected" || progress.disqualified) {
      btnText = "Assessment Terminated";
      btnDisabled = true;
    } else {
      const hasCompletedCurrent =
        roundResults && roundResults[roundToStart] !== undefined;
      const isNextAllocated =
        drive && drive.rounds && drive.rounds[roundToStart - 1] !== undefined;

      if (roundToStart > 5) {
        btnText = "✓ All Rounds Completed";
        btnDisabled = true;
      } else if (hasCompletedCurrent) {
        btnText = `⏳ Awaiting Shortlist for Round ${roundToStart}...`;
        btnDisabled = true;
      } else if (!isNextAllocated) {
        btnText = `Awaiting Allocation for Round ${roundToStart}...`;
        btnDisabled = true;
      } else {
        const rCfg = drive.rounds[roundToStart - 1];
        if (rCfg && rCfg.date && rCfg.time) {
          const dateParts = rCfg.date.split("-");
          const timeParts = rCfg.time.split(":");
          const schedStart = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
          );
          const now = new Date();
          const startDiff = schedStart.getTime() - now.getTime();

          if (startDiff > 0) {
            btnText = "⏳ This round has not started yet.";
            btnDisabled = true;
          } else {
            let schedEnd;
            if (rCfg.endDate && rCfg.endTime) {
              const endParts = rCfg.endDate.split("-");
              const endTimeParts = rCfg.endTime.split(":");
              schedEnd = new Date(
                parseInt(endParts[0]),
                parseInt(endParts[1]) - 1,
                parseInt(endParts[2]),
                parseInt(endTimeParts[0]),
                parseInt(endTimeParts[1]),
              );
            } else {
              const durationMins = rCfg.duration || 30;
              schedEnd = new Date(schedStart.getTime() + durationMins * 60000);
            }

            if (now > schedEnd) {
              btnText = "❌ Round deadline has expired.";
              btnDisabled = true;
            } else {
              btnText = `Enter Round ${roundToStart} (${rounds[roundToStart - 1].title}) →`;
              btnDisabled = false;
            }
          }
        } else {
          btnText = `Enter Round ${roundToStart} (${rounds[roundToStart - 1].title}) →`;
          btnDisabled = false;
        }
      }
    }

    html += `
      <div class="card card-glass" style="background: rgba(30,41,59,0.3); border: 1px solid var(--border-primary); border-radius: 16px; padding: 28px; margin-bottom: 32px; backdrop-filter: blur(8px); webkit-backdrop-filter: blur(8px); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 16px;">
          <div>
            <h3 style="font-size: 20px; font-weight: 800; color: #fff; margin:0 0 4px 0; display:flex; align-items:center; gap:8px;">
              <svg width="22" height="22" fill="none" stroke="var(--primary-400)" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              ${drive.title}
            </h3>
            <span style="font-size: 12px; color: var(--text-muted);">Drive Date: ${drive.date}</span>
          </div>
          <span class="badge" style="background:rgba(59,130,246,0.1); color:var(--primary-400); border:1px solid rgba(59,130,246,0.25); padding:6px 14px; border-radius:20px; font-weight:600; font-size:12px;">Active Campaign</span>
        </div>

        ${driveHeaderHtml}

        <div style="margin-bottom: 24px;">
          ${roundsHtml}
        </div>

        <div style="background:rgba(239,68,68,0.04); border:1px solid rgba(239,68,68,0.1); border-radius:8px; padding:10px 14px; margin-bottom:20px; font-size:12px; color:var(--text-secondary); display:flex; align-items:center; gap:8px;">
          <span style="color:var(--danger-400); font-weight:700;">⚠️ Strict Proctoring Enabled:</span> Screens, focus shifts, and fullscreen exits are strictly monitored.
        </div>

        <button class="btn btn-primary btn-lg" onclick="window.startPendingRoundForDrive('${drive.title.replace(/'/g, "\\'")}')" ${btnDisabled ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ""} style="width:100%; padding:14px; font-size:15px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:10px;">
          ${btnText}
        </button>
      </div>
    `;

    container.innerHTML = html;
  }

  window.startPendingRoundForDrive = function (driveTitle) {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("mockai_active_drive", driveTitle);
    }
    window._currentDriveTitle = driveTitle;
    window.startPendingRound();
  };

  window._pendingRoundNum = 0;
  window.startPendingRound = function () {
    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const cData = Storage.getCandidateData(
      userData.email || "candidate@mockai.com",
    );
    const roundToStart = cData.shortlistLevel || 1;

    if (!isCandidateAuthorizedForRound(roundToStart)) {
      return;
    }

    // Block re-entry only if formally completed or terminated
    if (cData.roundResults && cData.roundResults[roundToStart] !== undefined) {
      const st = cData.roundResults[roundToStart].status;
      if (st === "completed" || st === "terminated") {
        UI.toast(
          "This round is already completed. Re-attempts are not allowed.",
          "error",
        );
        return;
      }
      // 'in-progress' = previous session crashed/interrupted — allow re-entry
    }

    window._pendingRoundNum = roundToStart;

    // All rounds require system check first
    navigateTo("system-check");
  };

  function _launchRound(num) {
    if (!isCandidateAuthorizedForRound(num)) {
      navigateTo("candidate-exam");
      return;
    }

    // STRICT REALTIME TRACKING: Instantly initialize candidate active round status on entry!
    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const email = userData.email || "candidate@mockai.com";
    const cData = Storage.getCandidateData(email);
    cData.roundResults = cData.roundResults || {};
    cData.roundResults[num] = {
      round: num,
      type:
        num === 1
          ? "Aptitude Test"
          : num === 2
            ? "Coding Assessment"
            : num === 3
              ? "Advanced Technical"
              : num === 4
                ? "Communication"
                : "HR / Leadership",
      score: 0,
      percentage: 0,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      timeTaken: 0,
      timeTakenMs: 0,
      timestamp: new Date().toISOString(),
      status: "in-progress",
      violations: [],
    };
    Storage.saveCandidateData(email, cData);
    const allDrives = Storage.getHiringDrives();
    const activeDrive =
      allDrives.length > 0 ? allDrives[allDrives.length - 1] : null;
    const config = activeDrive?.rounds?.[num - 1] || {};

    // Bind current round settings to interviewConfig
    interviewConfig = {
      domain:
        config.topics && config.topics.length > 0
          ? config.topics.join(", ")
          : config.topic ||
            (num === 3
              ? "Technical Spoken"
              : num === 4
                ? "Communication Spoken"
                : "HR Scenario"),
      round: "Round " + num,
      difficulty: config.difficulty || 2,
      duration: config.duration || 20,
      questionCount: config.count || 8,
      voiceEnabled: true,
      webcamEnabled: num >= 3, // Enable AI camera proctoring only for Round 3 onwards
    };

    if (num === 1) {
      if (typeof AptitudeEngine !== "undefined") {
        AptitudeEngine.init(config);
        window._bypassExamAuth = true; // skip navigateTo re-auth since in-progress already saved
        navigateTo("aptitude");
        AptitudeEngine.start();
      }
    } else if (num === 2) {
      if (typeof CodingEngine !== "undefined") {
        CodingEngine.init(config);
        window._bypassExamAuth = true;
        navigateTo("coding");
        CodingEngine.start();
      }
    } else if (num === 5) {
      window._bypassExamAuth = true;
      navigateTo("resume-upload");
    } else {
      UI.toast("Round " + num + " (AI Interview) starting...", "info");
      window._bypassExamAuth = true;
      navigateTo("interview");
      _initInterview();
    }
  }

  // ── System Requirements Check ──
  function _runSystemCheck() {
    function _getEl(id) {
      const activeScreen = document.querySelector(".screen.active");
      if (activeScreen) {
        const el = activeScreen.querySelector(`#${id}`);
        if (el) return el;
      }
      return document.getElementById(id);
    }

    // Show verification button, hide others
    const startBtn = _getEl("btn-start-verification");
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = "Run Diagnostics";
      startBtn.classList.remove("hidden");
    }
    const proceedBtn = _getEl("btn-proceed-interview");
    if (proceedBtn) proceedBtn.classList.add("hidden");
    const enableFsBtn = _getEl("btn-enable-fullscreen");
    if (enableFsBtn) enableFsBtn.classList.add("hidden");
    const skipFsBtn = _getEl("btn-skip-fullscreen");
    if (skipFsBtn) skipFsBtn.classList.add("hidden");

    // Run the checks automatically!
    if (typeof VerificationEngine !== "undefined") {
      VerificationEngine.runChecks();
    }
  }

  window.proceedAfterCheck = function () {
    var num = window._pendingRoundNum || 1;
    if (!isCandidateAuthorizedForRound(num)) {
      navigateTo("candidate-exam");
      return;
    }

    // Check if already in fullscreen mode
    const isFS =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement;
    if (isFS) {
      if (num === 5) {
        navigateTo("resume-upload");
        return;
      }
      _launchRound(num);
      return;
    }

    // Request Fullscreen - Must strictly be native
    const elem = document.documentElement;
    const requestFS =
      elem.requestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.webkitRequestFullscreen ||
      elem.msRequestFullscreen;
    if (requestFS) {
      requestFS
        .call(elem)
        .then(() => {
          // Wait 150ms for layout transitions to settle and fullscreen state to propagate fully
          setTimeout(() => {
            const isFSNow =
              document.fullscreenElement ||
              document.webkitFullscreenElement ||
              document.mozFullScreenElement;
            if (isFSNow) {
              if (num === 5) {
                navigateTo("resume-upload");
                return;
              }
              _launchRound(num);
            } else {
              UI.toast(
                "Fullscreen mode is strictly mandatory for the entire examination. Please enable actual fullscreen to begin.",
                "error",
              );
            }
          }, 150);
        })
        .catch((err) => {
          UI.toast(
            "Fullscreen request was denied by the browser. Fullscreen is strictly mandatory.",
            "error",
          );
        });
    } else {
      UI.toast(
        "Your browser does not support the fullscreen API. Fullscreen is strictly mandatory.",
        "error",
      );
    }
  };

  window.manualEnableFullscreen = function () {
    const elem = document.documentElement;
    const requestFS =
      elem.requestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.webkitRequestFullscreen ||
      elem.msRequestFullscreen;
    if (requestFS) {
      requestFS
        .call(elem)
        .then(() => {
          const enableBtn = document.getElementById("btn-enable-fullscreen");
          if (enableBtn) enableBtn.classList.add("hidden");

          const proceedBtn = document.getElementById("btn-proceed-interview");
          if (proceedBtn) {
            const roundNum = window._pendingRoundNum || 1;
            proceedBtn.textContent =
              roundNum >= 3 ? "Begin Interview" : "Start Exam";
            proceedBtn.classList.remove("hidden");
          }

          const fsStatus = document.querySelector(
            "#verify-fullscreen .verify-status",
          );
          if (fsStatus) {
            fsStatus.innerHTML =
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" style="margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Fullscreen Active';
            fsStatus.className = "verify-status ok";
          }
          const fsItem = document.getElementById("verify-fullscreen");
          if (fsItem) fsItem.className = "verification-item active";
        })
        .catch((err) => {
          UI.toast("Fullscreen request was denied by the browser.", "error");
        });
    }
  };

  // ── Resume Upload ──
  window.handleResumeUpload = function (input) {
    if (input.files && input.files[0]) {
      var file = input.files[0];
      if (file.type !== "application/pdf") {
        UI.toast("Please upload a PDF file.", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        UI.toast("File too large. Max 5MB.", "error");
        return;
      }
      document.getElementById("resume-file-name").textContent =
        "✓ " + file.name;
      document.getElementById("resume-proceed-btn").disabled = false;
      document.getElementById("resume-proceed-btn").textContent =
        "Continue to HR Round →";
      // Store reference
      var userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
      var cData = Storage.getCandidateData(
        userData.email || "candidate@mockai.com",
      );
      cData.resumeName = file.name;
      Storage.saveCandidateData(
        userData.email || "candidate@mockai.com",
        cData,
      );
    }
  };
  window.proceedAfterResume = function () {
    UI.toast("HR/Leadership Round starting...", "info");
    navigateTo("interview");
    _initInterview();
  };

  // ── Strict Realtime Proctoring Tracking Helpers ──
  window.saveRealtimeViolation = function (violation) {
    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const email = userData.email || "candidate@mockai.com";
    const cData = Storage.getCandidateData(email);
    const roundNum = window._pendingRoundNum || cData.shortlistLevel || 1;
    if (cData.roundResults && cData.roundResults[roundNum]) {
      cData.roundResults[roundNum].violations =
        cData.roundResults[roundNum].violations || [];
      const vMsg =
        violation.reason || violation.message || "Security violation detected.";
      cData.roundResults[roundNum].violations.push({
        type: violation.type || "STRIKE",
        timestamp: violation.timestamp || new Date().toISOString(),
        severity: violation.severity || "warning",
        reason: vMsg,
      });
      Storage.saveCandidateData(email, cData);
    }
  };

  window.saveRealtimeTermination = function (reason) {
    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const email = userData.email || "candidate@mockai.com";
    const cData = Storage.getCandidateData(email);
    const roundNum = window._pendingRoundNum || cData.shortlistLevel || 1;
    cData.status = "rejected";
    cData.failedRound = roundNum;
    cData.disqualified = true;
    cData.disqualificationReason = reason;
    const rRes =
      cData.roundResults && cData.roundResults[roundNum]
        ? cData.roundResults[roundNum]
        : {};
    if (cData.roundResults && cData.roundResults[roundNum]) {
      cData.roundResults[roundNum].status = "terminated";
      cData.roundResults[roundNum].score = 0;
      cData.roundResults[roundNum].percentage = 0;
      cData.roundResults[roundNum].terminationReason = reason;
    }
    Storage.saveCandidateData(email, cData);

    let mappedQuestionResults = [];
    let ansCount = 0;
    let reviewCount = 0;
    let malpracticeIndex = -1;

    if (roundNum === 1) {
      const actQs =
        typeof AptitudeEngine !== "undefined" && AptitudeEngine.getQuestions
          ? AptitudeEngine.getQuestions()
          : [];
      const actAns =
        typeof AptitudeEngine !== "undefined" && AptitudeEngine.getAnswers
          ? AptitudeEngine.getAnswers()
          : {};
      const actReviews =
        typeof AptitudeEngine !== "undefined" &&
        AptitudeEngine.getMarkedForReview
          ? AptitudeEngine.getMarkedForReview()
          : {};

      if (
        typeof AptitudeEngine !== "undefined" &&
        AptitudeEngine.getCurrentIndex
      ) {
        malpracticeIndex = AptitudeEngine.getCurrentIndex();
      }

      ansCount = Object.keys(actAns).length;
      reviewCount = Object.keys(actReviews).filter(
        (i) => actAns[i] === undefined,
      ).length;

      mappedQuestionResults = actQs.map((q, idx) => {
        const selectedOption = actAns[idx];
        const isCorrect = selectedOption === q.correctOption;
        let candidateAnswerText = selectedOption
          ? `Option ${selectedOption}: ${q.options[["A", "B", "C", "D"].indexOf(selectedOption)] || ""}`
          : "Skipped / Unanswered";
        let correctAnswerText = `Option ${q.correctOption}: ${q.options[["A", "B", "C", "D"].indexOf(q.correctOption)] || ""}`;
        return {
          question: { q: q.text, a: correctAnswerText },
          answer: candidateAnswerText,
          isActuallyCorrect: isCorrect,
          evaluation: {
            score: 0,
            breakdown: {
              keyword: 0,
              completeness: 0,
              relevance: 0,
              structure: 0,
            },
          },
        };
      });
    } else if (roundNum === 2) {
      const actQs =
        typeof CodingEngine !== "undefined" && CodingEngine.getQuestions
          ? CodingEngine.getQuestions()
          : [];
      const actAns =
        typeof CodingEngine !== "undefined" && CodingEngine.getAnswers
          ? CodingEngine.getAnswers()
          : {};

      if (typeof CodingEngine !== "undefined" && CodingEngine.getCurrentIndex) {
        malpracticeIndex = CodingEngine.getCurrentIndex();
      }

      ansCount = Object.keys(actAns).filter(
        (i) => actAns[i] && actAns[i].code,
      ).length;

      mappedQuestionResults = actQs.map((q, idx) => {
        const submission = actAns[idx];
        const candidateAnswerText = submission
          ? `Language: ${submission.lang}\n\nCode:\n${submission.code}`
          : "Skipped / Unanswered";
        return {
          question: {
            q: q.title + ": " + q.desc,
            a:
              "Optimal Complexity: " +
              q.complexity +
              "\n\nConstraints: " +
              q.constraints,
          },
          answer: candidateAnswerText,
          isActuallyCorrect: false,
          evaluation: {
            score: 0,
            breakdown: {
              keyword: 0,
              completeness: 0,
              relevance: 0,
              structure: 0,
            },
          },
        };
      });
    } else {
      const actQs =
        typeof InterviewEngine !== "undefined" && InterviewEngine.getQuestions
          ? InterviewEngine.getQuestions()
          : [];
      const actResults =
        typeof InterviewEngine !== "undefined" && InterviewEngine.getResults
          ? InterviewEngine.getResults()
          : [];

      if (
        typeof InterviewEngine !== "undefined" &&
        InterviewEngine.getCurrentIndex
      ) {
        malpracticeIndex = InterviewEngine.getCurrentIndex();
      }

      ansCount = actResults.filter((r) => r.answer && !r.skipped).length;

      mappedQuestionResults = actQs.map((q) => {
        const res = actResults.find((r) => r.question.id === q.id) || {};
        const candidateAnswerText = res.answer || "Skipped / Unanswered";
        const isCorrect = res.evaluation && res.evaluation.score >= 60;
        return {
          question: {
            q: q.q,
            a:
              q.a ||
              "Provide professional response meeting all evaluation parameters.",
          },
          answer: candidateAnswerText,
          isActuallyCorrect: isCorrect ? true : false,
          evaluation: {
            score: 0,
            breakdown: {
              keyword: 0,
              completeness: 0,
              relevance: 0,
              structure: 0,
            },
          },
        };
      });
    }

    if (mappedQuestionResults.length === 0) {
      const isCoding = rRes.type && rRes.type.includes("Coding");
      const isAptitude =
        rRes.type && (rRes.type.includes("Aptitude") || roundNum === 1);
      const dummyQuestions = isCoding
        ? [
            {
              q: "Given an array of integers, find the contiguous subarray which has the largest sum.",
              a: "Use Kadane's Algorithm. Keep track of current maximum subarray sum ending at each position, and update global maximum.",
            },
            {
              q: "Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache.",
              a: "Combine a Doubly Linked List with a Hash Map to achieve O(1) operations for get and put.",
            },
          ]
        : isAptitude
          ? [
              {
                q: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
                a: "Length = Speed * Time. 60 km/hr = 60 * (5/18) m/s = 16.67 m/s. Length = 16.67 * 9 = 150 meters.",
              },
              {
                q: "Point to a photograph, Vipul said, 'She is the daughter of my grandfather's only son.' How is Vipul related to the girl?",
                a: "Grandfather's only son is Vipul's father. Father's daughter is Vipul's sister. So Vipul is her brother.",
              },
              {
                q: "Find the odd one out: 3, 5, 7, 12, 17, 19.",
                a: "12 is the odd one out because all others are prime numbers.",
              },
              {
                q: "If A + B means A is the brother of B; A - B means A is the sister of B; what does P + R - Q mean?",
                a: "P is the brother of R, and R is the sister of Q. Therefore, P is the brother of Q.",
              },
            ]
          : [
              {
                q: "Tell me about yourself and your technical background.",
                a: "The response should clearly outline educational accomplishments, project experiences, and specific role interest with confident delivery.",
              },
              {
                q: "Explain the difference between supervised and unsupervised learning.",
                a: "Supervised learning relies on labeled training datasets (e.g., classification), whereas unsupervised learning finds hidden patterns in unlabeled data (e.g., clustering).",
              },
              {
                q: "Describe a challenging bug or architecture problem you resolved.",
                a: "Using the STAR method: describe the Situation, Task, Action taken, and the positive, quantifiable Result of the fix.",
              },
              {
                q: "How do you ensure code quality and system performance in your projects?",
                a: "Through rigorous code reviews, automated unit testing, load balancing, profiling, and adhering to strict clean architecture principles.",
              },
            ];

      mappedQuestionResults = dummyQuestions.map((q) => ({
        question: { q: q.q, a: q.a },
        answer: "Skipped / Unanswered (Exam Terminated)",
        isActuallyCorrect: false,
        evaluation: {
          score: 0,
          breakdown: {
            keyword: 0,
            completeness: 0,
            relevance: 0,
            structure: 0,
          },
        },
      }));
    }

    mappedQuestionResults.forEach((r, idx) => {
      if (idx === malpracticeIndex) {
        r.isMalpracticeQuestion = true;
        r.answer =
          `[⚠️ MALPRACTICE COMMITTED ON THIS QUESTION: ${reason}] ` +
          (r.answer || "Skipped / Unanswered");
      }
    });

    // ── Save terminated report to interviewer Reports page ──
    const terminatedSession = {
      driveTitle: Storage.getActiveDriveTitle(),
      candidateName: cData.name || userData.name || "Candidate",
      regNumber: cData.reg || userData.reg || "DEMO123",
      domain:
        rRes.type ||
        (roundNum === 1
          ? "Aptitude Test"
          : roundNum === 2
            ? "Coding Assessment"
            : "Assessment Round " + roundNum),
      difficulty: 2,
      duration: rRes.timeTaken || 0,
      timestamp: new Date().toISOString(),
      score: 0,
      grade: "F",
      questionsAnswered: ansCount,
      totalQuestions: mappedQuestionResults.length,
      violations: rRes.violations || [],
      isTerminated: true,
      terminationReason: reason,
      analysis: {
        grade: "F",
        totalScore: 0,
        avgResponseTime: 0,
        avgConfidence: 0,
        communicationScore: 0,
        strengths: [],
        weaknesses: ["Disqualified: Malpractice detected"],
        questionResults: mappedQuestionResults,
        questionsAnswered: ansCount,
      },
    };
    Storage.saveInterview(terminatedSession);
  };

  window.finishAptitudeRound = function (result) {
    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const email = userData.email || "candidate@mockai.com";
    const cData = Storage.getCandidateData(email);
    cData.roundResults = cData.roundResults || {};
    cData.roundResults[1] = { ...result, status: "completed" };
    Storage.saveCandidateData(email, cData);
    // Map to sessionData for unified detailed results report display!
    // Map the actual questions attended by the candidate
    const actualQuestions = result.questions || [];
    const actualAnswers = result.answers || {};
    const mappedQuestionResults = actualQuestions.map((q, idx) => {
      const selectedOption = actualAnswers[idx];
      const isCorrect = selectedOption === q.correctOption;
      const score = isCorrect ? 100 : selectedOption ? 0 : 0;

      let candidateAnswerText = selectedOption
        ? `Option ${selectedOption}: ${q.options[["A", "B", "C", "D"].indexOf(selectedOption)] || ""}`
        : "Skipped";
      let correctAnswerText = `Option ${q.correctOption}: ${q.options[["A", "B", "C", "D"].indexOf(q.correctOption)] || ""}`;

      return {
        question: {
          q: q.text,
          a: correctAnswerText,
        },
        answer: candidateAnswerText,
        evaluation: {
          score: score,
          breakdown: {
            keyword: isCorrect ? 100 : 0,
            completeness: selectedOption ? 100 : 0,
            relevance: isCorrect ? 100 : 50,
            structure: selectedOption ? 100 : 0,
          },
        },
      };
    });

    // Map to sessionData for unified detailed results report display!
    const sessionData = {
      driveTitle: Storage.getActiveDriveTitle(),
      candidateName: cData.name || userData.name || "Candidate",
      regNumber: cData.reg || userData.reg || "DEMO123",
      domain: "Aptitude Test",
      difficulty: 2,
      duration: result.timeTaken,
      timestamp: result.timestamp,
      score: Math.round(result.percentage),
      grade:
        result.percentage >= 80
          ? "A+"
          : result.percentage >= 60
            ? "B"
            : result.percentage >= 40
              ? "C"
              : "F",
      questionsAnswered: result.correct + result.incorrect,
      totalQuestions: result.correct + result.incorrect + result.unanswered,
      violations: result.violations || [],
      analysis: {
        grade:
          result.percentage >= 80
            ? "A+"
            : result.percentage >= 60
              ? "B"
              : result.percentage >= 40
                ? "C"
                : "F",
        totalScore: Math.round(result.percentage),
        avgResponseTime:
          result.timeTaken / Math.max(1, result.correct + result.incorrect),
        avgConfidence: 85,
        communicationScore: 100,
        strengths: [
          "Quantitative Analysis",
          result.correct > result.incorrect
            ? "Logical Deduction"
            : "Concept Accuracy",
        ],
        weaknesses: [
          result.incorrect > 3 ? "Speed Optimization" : "Precision Care",
        ],
        questionResults: mappedQuestionResults,
      },
    };

    // Save detailed report to storage
    Storage.saveInterview(sessionData);

    // Post Submission Flow
    UI.toast("Exam submitted successfully.", "success");

    // Exit fullscreen safely
    if (typeof Security !== "undefined") {
      Security.deactivate();
    }
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen().catch(() => {});
    }

    // Redirect candidate to home/dashboard page
    navigateTo("dashboard");
  };

  window.finishCodingRound = function (result) {
    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const email = userData.email || "candidate@mockai.com";
    const cData = Storage.getCandidateData(email);
    cData.roundResults = cData.roundResults || {};
    cData.roundResults[2] = { ...result, status: "completed" };
    Storage.saveCandidateData(email, cData);

    const actualCodingQuestions = result.questions || [];
    const codeSubmissions = result.codeSubmissions || {};
    const mappedCodingQuestionResults = actualCodingQuestions.map((q, idx) => {
      const submission = codeSubmissions[idx] || {};
      const writtenCode = submission.code || "";
      const isAnswered = writtenCode.trim().length > 20;
      const qScore = isAnswered ? result.percentage : 0;

      return {
        question: {
          q: q.title + " — " + q.description.replace(/<[^>]*>/g, ""), // Strip HTML
          a:
            "Optimal Solution requires clean structure and passing all test cases. Starter template:\n" +
            Object.values(q.starterCode || {})[0],
        },
        answer: isAnswered
          ? `[${submission.lang || "Code"}] \n` + writtenCode
          : "Skipped / No code submitted",
        evaluation: {
          score: qScore,
          breakdown: {
            keyword: isAnswered ? 90 : 0,
            completeness: isAnswered ? 95 : 0,
            relevance: isAnswered ? 85 : 0,
            structure: isAnswered ? 90 : 0,
          },
        },
      };
    });

    // Map to sessionData for unified detailed results report display!
    const sessionData = {
      driveTitle: Storage.getActiveDriveTitle(),
      candidateName: cData.name || userData.name || "Candidate",
      regNumber: cData.reg || userData.reg || "DEMO123",
      domain: "Coding Assessment",
      difficulty: 3,
      duration: result.timeTaken,
      timestamp: result.timestamp,
      score: Math.round(result.percentage),
      grade:
        result.percentage >= 80
          ? "A"
          : result.percentage >= 60
            ? "B"
            : result.percentage >= 40
              ? "C"
              : "F",
      questionsAnswered: Object.keys(result.codeSubmissions || {}).length || 1,
      totalQuestions: 2,
      violations: result.violations || [],
      analysis: {
        grade:
          result.percentage >= 80
            ? "A"
            : result.percentage >= 60
              ? "B"
              : result.percentage >= 40
                ? "C"
                : "F",
        totalScore: Math.round(result.percentage),
        avgResponseTime:
          result.timeTaken /
          Math.max(1, Object.keys(result.codeSubmissions || {}).length),
        avgConfidence: 90,
        communicationScore: 100,
        strengths: ["Algorithmic Rigor", "Syntax Cleanliness", "Code Logic"],
        weaknesses: [
          result.percentage < 60
            ? "Algorithmic Efficiency"
            : "Refactoring Practice",
        ],
        questionResults: mappedCodingQuestionResults,
      },
    };

    // Save detailed report to storage
    Storage.saveInterview(sessionData);

    // Post Submission Flow
    UI.toast("Exam submitted successfully.", "success");

    // Exit fullscreen safely
    if (typeof Security !== "undefined") {
      Security.deactivate();
    }
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen().catch(() => {});
    }

    // Redirect candidate to home/dashboard page
    navigateTo("dashboard");
  };

  // ══════════ SETUP VIEW (ADMIN DRIVE ALLOCATION — ALL 5 ROUNDS) ══════════
  function _renderSetup() {
    interviewConfig = {
      domain: "",
      round: "Technical Round 1",
      difficulty: 1,
      duration: 20,
      questionCount: 10,
      voiceEnabled: true,
      webcamEnabled: true,
    };
    const container = document.getElementById("hiring-drive-setup-container");
    if (container && typeof SetupConfig !== "undefined") {
      container.innerHTML = SetupConfig.renderAll();
    }
    _showSetupStep(1);
  }

  window.allocateDriveRound = function (roundNum) {
    if (typeof SetupConfig !== "undefined") SetupConfig.allocateRound(roundNum);
    else UI.toast("Round " + roundNum + " allocated.", "success");
  };
  window.allocateAllRounds = function () {
    if (typeof SetupConfig !== "undefined") SetupConfig.allocateAll();
  };

  // ══════════ SCHEDULE EXAM (Interviewer) ══════════
  window.selectRound = function (round, el) {
    interviewConfig.round = round;
    const parent = el.parentElement;
    if (parent)
      parent
        .querySelectorAll(".option-card")
        .forEach((c) => c.classList.remove("selected"));
    el.classList.add("selected");
    _updateScheduleSummary();
  };

  window.selectQuestionCount = function (count, el) {
    interviewConfig.questionCount = count;
    const parent = el.parentElement;
    if (parent)
      parent
        .querySelectorAll(".option-card")
        .forEach((c) => c.classList.remove("selected"));
    el.classList.add("selected");
    _updateScheduleSummary();
  };

  function _updateScheduleSummary() {
    const cfg = interviewConfig;
    const diffLabel =
      ["", "Fresher", "Intermediate", "Expert"][cfg.difficulty] || "—";
    const setT = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setT("summary-domain", "Domain: " + (cfg.domain || "—"));
    setT("summary-round", "Round: " + (cfg.round || "—"));
    setT("summary-difficulty", "Difficulty: " + diffLabel);
    setT("summary-questions", "Questions: " + (cfg.questionCount || 10));
    setT("summary-duration", "Duration: " + (cfg.duration || 20) + " min");
  }

  window.scheduleExamForCandidate = function () {
    if (!interviewConfig.domain) {
      UI.toast("Please select a question domain first.", "error");
      return;
    }

    const title =
      (document.getElementById("schedule-exam-title") || {}).value || "";

    const exam = {
      id: "exam_" + Date.now(),
      type: "broadcast", // available to ALL @nec.edu.in students
      title: title.trim() || interviewConfig.domain,
      domain: interviewConfig.domain,
      round: interviewConfig.round || "Technical Round 1",
      difficulty: interviewConfig.difficulty || 1,
      duration: interviewConfig.duration || 20,
      questionCount: interviewConfig.questionCount || 10,
      examDate: (document.getElementById("schedule-date") || {}).value || "",
      examTime: (document.getElementById("schedule-time") || {}).value || "",
      scheduledAt: new Date().toISOString(),
      status: "pending",
    };

    // Replace any existing pending broadcast exam
    const existing = JSON.parse(
      localStorage.getItem("mockai_scheduled_exams") || "[]",
    );
    const filtered = existing.filter(
      (e) => !(e.type === "broadcast" && e.status === "pending"),
    );
    filtered.push(exam);
    localStorage.setItem("mockai_scheduled_exams", JSON.stringify(filtered));

    UI.toast(`✓ Exam scheduled for all @nec.edu.in students!`, "success");
    setTimeout(() => navigateTo("interviewer-dashboard"), 1200);
  };

  // ══════════ JOIN SCHEDULED EXAM (Candidate) ══════════
  window.joinScheduledExam = function (examId) {
    const allExams = JSON.parse(
      localStorage.getItem("mockai_scheduled_exams") || "[]",
    );
    const exam = allExams.find((e) => e.id === examId);
    if (!exam) {
      UI.toast("Exam not found.", "error");
      return;
    }

    // Load exam config
    interviewConfig = {
      domain: exam.domain,
      difficulty: exam.difficulty,
      duration: exam.duration,
      questionCount: exam.questionCount,
      voiceEnabled: true,
      webcamEnabled: true,
    };

    // Mark exam as started
    exam.status = "started";
    localStorage.setItem("mockai_scheduled_exams", JSON.stringify(allExams));

    startInterview();
  };

  // Duplicate renderSetup removed to prevent overriding the 5-Round allocator

  function _showSetupStep(step) {
    document
      .querySelectorAll(".setup-step")
      .forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(`setup-step-${step}`);
    if (el) el.classList.add("active");

    // Update progress dots
    document.querySelectorAll(".setup-progress-dot").forEach((dot, i) => {
      dot.classList.remove("active", "completed");
      if (i + 1 === step) dot.classList.add("active");
      else if (i + 1 < step) dot.classList.add("completed");
    });
    document.querySelectorAll(".setup-progress-line").forEach((line, i) => {
      line.classList.toggle("completed", i + 1 < step);
    });
  }

  window.selectDomain = function (domain) {
    interviewConfig.domain = domain;
    document
      .querySelectorAll("#setup-step-1 .option-card")
      .forEach((c) => c.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
    _updateScheduleSummary();
  };

  window.selectDifficulty = function (diff) {
    interviewConfig.difficulty = diff;
    document
      .querySelectorAll("#setup-step-2 .option-card")
      .forEach((c) => c.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
    _updateScheduleSummary();
  };

  window.selectDuration = function (dur) {
    interviewConfig.duration = dur;
    document
      .querySelectorAll("#setup-step-2 .option-card")
      .forEach((c) => c.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
    _updateScheduleSummary();
  };

  window.nextSetupStep = function (step) {
    if (step === 2 && !interviewConfig.domain) {
      UI.toast("Please select a domain", "warning");
      return;
    }
    _showSetupStep(step);
  };

  window.prevSetupStep = function (step) {
    _showSetupStep(step);
  };

  window.startInterview = function () {
    if (!interviewConfig.domain) {
      UI.toast("Please complete setup", "warning");
      return;
    }

    const settings = Storage.getSettings();
    interviewConfig.voiceEnabled = settings.voiceEnabled;
    interviewConfig.webcamEnabled = settings.webcamEnabled;

    // Show Profile Screen first (as requested)
    navigateTo("candidate-profile");
  };

  window.saveProfileAndContinue = function () {
    const name = document.getElementById("cand-name").value.trim();
    const reg = document.getElementById("cand-reg").value.trim();

    if (!name || !reg) {
      UI.toast("Please enter your Name and Register Number", "warning");
      return;
    }

    interviewConfig.candidateName = name;
    interviewConfig.regNumber = reg;

    // Now go to verification
    navigateTo("verification");
  };

  // Expose to window so verification.js can trigger the real interview start
  window.actuallyStartInterview = function (profile) {
    // Profile is already set in interviewConfig via saveProfileAndContinue,
    // but we can update it if passed (for redundancy)
    if (profile) {
      interviewConfig.candidateName =
        profile.name || interviewConfig.candidateName;
      interviewConfig.regNumber = profile.reg || interviewConfig.regNumber;
    }

    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-interview").classList.add("active");
    document.body.classList.add("interview-active");
    _initInterview();
  };

  // ══════════ INTERVIEW ══════════
  async function _initInterview() {
    const chatArea = document.getElementById("chat-area");
    chatArea.innerHTML = "";

    const questionCount = InterviewEngine.init(interviewConfig, {
      onStateChange: _handleInterviewState,
      onTimer: _handleTimer,
      onComplete: _handleInterviewComplete,
    });

    // Update UI
    document.getElementById("interview-domain").textContent =
      interviewConfig.domain;
    document.getElementById("interview-timer").textContent = UI.formatTime(
      interviewConfig.duration * 60,
    );
    document.getElementById("q-current").textContent = "0";
    document.getElementById("q-total").textContent = questionCount;
    document.getElementById("violation-count").textContent = "0";

    // Security
    Security.activate({
      webcamEnabled: interviewConfig.webcamEnabled,
      onViolation: _handleSecurityViolation,
      onTerminate: _handleSecurityTerminate,
    });

    // Camera & Face Detection (Re-enabled per user request)
    if (interviewConfig.webcamEnabled) {
      document.getElementById("webcam-container").classList.remove("hidden");
      try {
        const camSuccess = await _initCamera();
        if (!camSuccess) {
          _handleSecurityTerminate(
            "Camera access is strictly required. Please allow camera permissions and ensure no other app is using it.",
          );
          return; // Stop initialization
        }
      } catch (e) {
        _handleSecurityTerminate("Camera initialization failed.");
        return;
      }
    } else {
      document.getElementById("webcam-container").classList.add("hidden");
    }

    // Fullscreen (Mandatory)
    Security.requestFullscreen();

    // Show Webcam PiP in corner explicitly
    const webcamContainer = document.getElementById("webcam-container");
    if (webcamContainer && interviewConfig.webcamEnabled) {
      webcamContainer.style.display = "block";
      webcamContainer.classList.remove("hidden");
    }

    // Start interview
    await InterviewEngine.start();
  }

  window.proctorCameraStart = async function () {
    document.getElementById("webcam-container").classList.remove("hidden");
    document.getElementById("webcam-container").style.display = "block";
    const success = await _initCamera();
    return success;
  };

  window.proctorCameraStop = function () {
    try {
      FaceDetection.stopCamera();
    } catch (e) {}
    try {
      if (typeof VerificationEngine !== "undefined")
        VerificationEngine.stopStreams();
    } catch (e) {}
    const webcamContainer = document.getElementById("webcam-container");
    if (webcamContainer) {
      webcamContainer.style.display = "none";
      webcamContainer.classList.add("hidden");
    }
    const ep = document.getElementById("emotion-panel");
    if (ep) ep.classList.add("hidden");
  };

  async function _initCamera() {
    try {
      const camInit = await FaceDetection.init("#webcam-video-container");
      if (!camInit) {
        _updateWebcamStatus("error", "Init Failed");
        return false;
      }
      const camStarted = await FaceDetection.startCamera();

      // EXTRA STRICT: Verify stream is actually sending data
      if (camStarted && FaceDetection.isCameraActive()) {
        FaceDetection.startDetection({
          onViolation: _handleFaceViolation,
          onStatus: _handleFaceStatus,
          onEmotion: _handleEmotionUpdate,
        });
        _updateWebcamStatus("ok", "Face Detected");
        document.getElementById("emotion-panel")?.classList.remove("hidden");
        return true;
      } else {
        _updateWebcamStatus("error", "Camera Blocked/Inactive");
        return false;
      }
    } catch (e) {
      _updateWebcamStatus("error", "Camera Error");
      return false;
    }
  }

  function _handleInterviewState(state, data) {
    const chatArea = document.getElementById("chat-area");

    switch (state) {
      case "greeting":
      case "questioning":
      case "followup":
      case "wrapping":
        _updateTeleprompter(data.message);
        if (data.questionNumber) {
          document.getElementById("q-current").textContent =
            data.questionNumber;
        }
        break;

      case "answering":
        _enableVoiceInput(data.isFollowUp);
        break;

      case "feedback":
        _updateTeleprompter(data.message);
        _disableVoiceInput();
        break;

      case "evaluating":
        _disableVoiceInput();
        break;

      case "wrapping":
        _updateTeleprompter(data.message);
        // Force camera off immediately when concluding
        FaceDetection.stopCamera();
        const webcamContainerWrapping =
          document.getElementById("webcam-container");
        if (webcamContainerWrapping) {
          webcamContainerWrapping.style.display = "none";
          webcamContainerWrapping.classList.add("hidden");
        }
        break;

      case "finished":
        currentSessionData = data.sessionData;
        FaceDetection.stopCamera();
        break;
    }
  }

  function _updateTeleprompter(text) {
    const aiTextEl = document.getElementById("ai-question-text");
    if (aiTextEl) {
      aiTextEl.textContent = text;
      // Add subtle animation
      aiTextEl.style.animation = "none";
      void aiTextEl.offsetWidth; // trigger reflow
      aiTextEl.style.animation = "messageSlideIn 0.3s ease-out";
    }
  }

  function _enableVoiceInput(isFollowUp) {
    const btn = document.getElementById("submit-answer-btn");
    const voiceBtn = document.getElementById("voice-btn");
    if (btn) btn.disabled = false;
    if (voiceBtn) voiceBtn.disabled = false;

    document.getElementById("voice-transcript").textContent =
      "Waiting for you to speak...";
    document.getElementById("voice-transcript").style.color =
      "var(--text-muted)";
    document.getElementById("answer-input").value = "";

    // Automatically toggle voice if settings allow
    const settings = Storage.getSettings();
    if (settings.voiceEnabled && !Speech.isListening()) {
      setTimeout(() => toggleVoice(), 500); // Auto-start recording
    }
  }

  function _disableVoiceInput() {
    const btn = document.getElementById("submit-answer-btn");
    const voiceBtn = document.getElementById("voice-btn");
    if (btn) btn.disabled = true;
    if (voiceBtn) voiceBtn.disabled = true;

    if (Speech.isListening()) {
      toggleVoice(); // stop if it was recording
    }
  }

  function _handleTimer(seconds) {
    const timerEl = document.getElementById("interview-timer");
    timerEl.textContent = UI.formatTime(seconds);
    timerEl.parentElement.classList.remove("warning", "danger");
    if (seconds <= 60) timerEl.parentElement.classList.add("danger");
    else if (seconds <= 300) timerEl.parentElement.classList.add("warning");
  }

  function _handleInterviewComplete(sessionData) {
    currentSessionData = sessionData;
    _endInterviewUI();

    // Save spoken round result in candidate pipeline
    const userData = JSON.parse(sessionStorage.getItem("mockai_user") || "{}");
    const email = userData.email || "candidate@mockai.com";
    const cData = Storage.getCandidateData(email);
    const roundNum = window._pendingRoundNum || cData.shortlistLevel || 3;

    // Save to roundResults
    cData.roundResults[roundNum] = {
      round: roundNum,
      type:
        roundNum === 3
          ? "Advanced Technical"
          : roundNum === 4
            ? "Communication"
            : "HR / Leadership",
      status: "completed",
      score: sessionData.score,
      confidence: sessionData.analysis.avgConfidence || 75,
      depth: (sessionData.questionsAnswered || 4) * 20,
      timeTaken: sessionData.duration,
      timeTakenMs: sessionData.duration * 1000,
      timestamp: sessionData.timestamp,
      violations:
        typeof Security !== "undefined" ? Security.getViolations() : [],
    };

    UI.toast(
      `Round ${roundNum} completed successfully! Awaiting recruiter shortlist.`,
      "success",
    );

    // Save updated candidate data
    Storage.saveCandidateData(email, cData);

    _showResults(sessionData);
  }

  function _handleSecurityViolation(violation) {
    if (window.saveRealtimeViolation) window.saveRealtimeViolation(violation);
    document.getElementById("violation-count").textContent =
      Security.getViolationCount();
    const messages = {
      TAB_SWITCH: `Tab switch detected! (${violation.count}/1)`,
      COPY_PASTE: "Copy/paste is not allowed during interview!",
      RIGHT_CLICK: "Right-click is disabled during interview.",
      DEVTOOLS_ATTEMPT: "Developer tools are not allowed!",
      DEVTOOLS_OPEN: "Close developer tools immediately!",
      IDLE_WARNING: "No activity detected. Please continue your interview.",
      FULLSCREEN_EXIT: "Please stay in fullscreen mode.",
      SUSPICIOUS_RESIZE: "Suspicious window resize detected.",
    };
    const msg = messages[violation.type] || "Security violation detected.";
    UI.showSecurityAlert(
      msg,
      violation.severity === "critical" ? "danger" : "warning",
    );
    UI.toast(
      msg,
      violation.severity === "critical" ? "danger" : "warning",
      "Security Alert",
    );

    // Human-like AI Proctor Warning
    if (
      interviewConfig &&
      interviewConfig.voiceEnabled &&
      violation.severity !== "critical"
    ) {
      const settings = Storage.getSettings();
      Speech.speak(`Warning. ${msg}`, {
        rate: settings.aiVoiceRate,
        pitch: settings.aiVoicePitch,
      });
    }
  }

  function _handleSecurityTerminate(reason) {
    if (window.saveRealtimeTermination) window.saveRealtimeTermination(reason);
    // Explicitly set termination reason in config for InterviewEngine to capture
    interviewConfig.terminationReason = reason;
    interviewConfig.isTerminated = true;

    // 1. Save the session data immediately before shutting down
    InterviewEngine.endEarly();

    // 2. Shutdown hardware/proctoring
    FaceDetection.stopCamera();
    Security.deactivate();

    const webcamContainer = document.getElementById("webcam-container");
    if (webcamContainer) {
      webcamContainer.style.display = "none";
      webcamContainer.classList.add("hidden");
    }

    // Human-like AI Proctor Termination
    if (interviewConfig && interviewConfig.voiceEnabled) {
      const settings = Storage.getSettings();
      Speech.speak(
        `Security violation detected. This interview has been terminated. Reason: ${reason.replace(/\(Illegal Move\)/g, "")}`,
        { rate: settings.aiVoiceRate, pitch: settings.aiVoicePitch },
      );
    }

    UI.showModal({
      title: "Interview Terminated",
      content: `<p style="color:var(--danger-400)">Your interview has been terminated due to security violations.</p><p><strong>Reason:</strong> ${reason}</p><p>You will be redirected to the dashboard.</p>`,
      confirmText: "Return Home",
      onConfirm: () => {
        window.endInterview();
      },
      onCancel: false,
    });
  }

  function _handleFaceViolation(data) {
    const messages = {
      NO_FACE: "No face detected! (Strike Issued)",
      NO_FACE_WARNING: "Face not detected — please look at the screen.",
      LOOK_AWAY: "Illegal Eye Movement! (Strike Issued)",
      MULTIPLE_FACES: "Multiple persons detected! (Strike Issued)",
      HIGH_NERVOUSNESS: "Take a deep breath. You seem nervous.",
    };
    const msg = messages[data.type] || "Face detection issue.";

    if (data.severity === "critical") {
      // Reverted to 3-Strike system per user request
      if (typeof Security !== "undefined" && Security.isActivated()) {
        Security.triggerViolation({
          type: data.type,
          severity: "critical",
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      if (typeof UI !== "undefined") UI.toast(msg, "warning");
    }
  }

  function _handleEmotionUpdate(emotion) {
    const panel = document.getElementById("emotion-panel");
    if (!panel) return;
    const nervClass =
      emotion.nervousness > 60
        ? "nervous"
        : emotion.nervousness > 30
          ? "mild"
          : "calm";
    const nervLabel =
      emotion.nervousness > 60
        ? "Nervous"
        : emotion.nervousness > 30
          ? "Mild Stress"
          : "Calm";
    const barColor = (v) =>
      v > 70 ? "#22c55e" : v > 40 ? "#eab308" : "#ef4444";
    const nervColor =
      emotion.nervousness < 30
        ? "#22c55e"
        : emotion.nervousness < 60
          ? "#eab308"
          : "#ef4444";
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
    const labels = {
      ok: "Face Detected",
      "no-face": "No Face",
      "look-away": "Look Away",
      "too-far": "Too Far",
    };
    const types = {
      ok: "ok",
      "no-face": "error",
      "look-away": "warn",
      "too-far": "warn",
    };
    _updateWebcamStatus(types[status] || "ok", labels[status] || "Active");
  }

  function _updateWebcamStatus(type, text) {
    const el = document.getElementById("webcam-status");
    if (el) {
      el.className = `webcam-status ${type}`;
      el.innerHTML = `<span class="webcam-status-dot"></span>${text}`;
    }
    const eyeEl = document.getElementById("eye-indicator");
    if (eyeEl) {
      eyeEl.className = `eye-indicator ${type === "ok" ? "tracking" : "away"}`;
      eyeEl.textContent = type === "ok" ? "Tracking" : "Away";
    }
  }

  // Submit answer
  window.submitAnswer = function () {
    const textarea = document.getElementById("answer-input");
    const answer = textarea.value.trim();
    if (!answer) {
      UI.toast("Please say or type something before submitting!", "warning");
      return;
    }

    _disableVoiceInput();
    document.getElementById("voice-transcript").textContent =
      "Submitting answer...";

    const result = InterviewEngine.submitAnswer(answer);
    if (result) {
      setTimeout(() => InterviewEngine.processAfterAnswer(result), 800);
    }
  };

  window.enableTypingFallback = function () {
    const textarea = document.getElementById("answer-input");
    const voiceTranscript = document.getElementById("voice-transcript");
    if (textarea) {
      textarea.classList.remove("hidden");
      textarea.style.display = "block";
      textarea.disabled = false;
      textarea.focus();
      if (voiceTranscript) voiceTranscript.style.display = "none";
      if (Speech.isListening()) toggleVoice();
      UI.toast("Typing mode enabled. Type your answer in the box.", "info");
    }
  };

  // Voice recording
  window.toggleVoice = function () {
    const btn = document.getElementById("voice-btn");
    const btnText = document.getElementById("voice-btn-text");
    const transcript = document.getElementById("voice-transcript");

    if (Speech.isListening()) {
      Speech.stopListening();
      btn.classList.remove("recording");
      if (btnText) btnText.textContent = "Start Speaking";
    } else {
      const started = Speech.startListening({
        onResult: (result) => {
          document.getElementById("answer-input").value = result.full;
          transcript.textContent = result.full || "Listening...";
          transcript.style.color = "var(--text-primary)";
        },
        onStart: () => {
          btn.classList.add("recording");
          if (btnText) btnText.textContent = "Recording...";
          transcript.textContent = "Listening...";
        },
        onEnd: () => {
          btn.classList.remove("recording");
          if (btnText) btnText.textContent = "Start Speaking";
        },
      });
      if (!started)
        UI.toast("Voice input not supported in this browser", "warning");
    }
  };

  // Get hint
  window.getHint = function () {
    const hint = InterviewEngine.getHint();
    if (hint) {
      UI.toast(hint, "info", "Hint");
    }
  };

  // Skip question
  window.skipQuestion = function () {
    UI.confirm(
      "Are you sure you want to skip this question? It will be scored as 0.",
    ).then((ok) => {
      if (ok) {
        _addChatMessage("user", "<em>(Question skipped)</em>");
        InterviewEngine.skipQuestion();
      }
    });
  };

  // End interview — BULLETPROOF HARDWARE SHUTDOWN
  window.endInterview = function () {
    _endInterviewUI();
    navigateTo("dashboard");
    UI.toast("Session ended. Camera off.", "info");
  };

  function _endInterviewUI() {
    // 1. Stop interview engine & security
    try {
      InterviewEngine.stop();
    } catch (e) {}
    try {
      Security.deactivate();
    } catch (e) {}
    try {
      Security.exitFullscreen();
    } catch (e) {}

    // 2. Kill camera hardware IMMEDIATELY
    try {
      FaceDetection.stopCamera();
    } catch (e) {}
    try {
      if (typeof VerificationEngine !== "undefined")
        VerificationEngine.stopStreams();
    } catch (e) {}

    // 3. Stop speech
    try {
      Speech.stopSpeaking();
    } catch (e) {}
    try {
      Speech.stopListening();
    } catch (e) {}

    // 4. Hide interview UI
    document.body.classList.remove("interview-active");

    // 5. Hide PiP camera
    const webcamContainer = document.getElementById("webcam-container");
    if (webcamContainer) {
      webcamContainer.style.display = "none";
      webcamContainer.classList.add("hidden");
    }

    // 6. Restore sidebar
    const nav = document.querySelector(".main-nav");
    if (nav && sessionStorage.getItem("mockai_logged_in"))
      nav.style.display = "flex";

    // 7. Hide emotion panel
    const ep = document.getElementById("emotion-panel");
    if (ep) ep.classList.add("hidden");
  }

  // ══════════ RESULTS ══════════
  function _showResults(sessionData) {
    _endInterviewUI();
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-results").classList.add("active");
    currentSessionData = sessionData;
    const a = sessionData.analysis;

    // Dynamically populate questionResults if they are missing or empty to ensure scores, radar chart, and Q-by-Q reviews are fully rendered
    if (a && (!a.questionResults || a.questionResults.length === 0)) {
      const score = a.totalScore || sessionData.score || 0;
      const isCoding =
        sessionData.domain && sessionData.domain.includes("Coding");
      const isAptitude =
        sessionData.domain && sessionData.domain.includes("Aptitude");

      const generatedResults = [];
      const questions = isCoding
        ? [
            {
              q: "Given an array of integers, find the contiguous subarray which has the largest sum.",
              a: "Use Kadane's Algorithm. Keep track of current maximum subarray sum ending at each position, and update global maximum.",
            },
            {
              q: "Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache.",
              a: "Combine a Doubly Linked List with a Hash Map to achieve O(1) operations for get and put.",
            },
          ]
        : isAptitude
          ? [
              {
                q: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
                a: "Length = Speed * Time. 60 km/hr = 60 * (5/18) m/s = 16.67 m/s. Length = 16.67 * 9 = 150 meters.",
              },
              {
                q: "Point to a photograph, Vipul said, 'She is the daughter of my grandfather's only son.' How is Vipul related to the girl?",
                a: "Grandfather's only son is Vipul's father. Father's daughter is Vipul's sister. So Vipul is her brother.",
              },
              {
                q: "Find the odd one out: 3, 5, 7, 12, 17, 19.",
                a: "12 is the odd one out because all others are prime numbers.",
              },
              {
                q: "If A + B means A is the brother of B; A - B means A is the sister of B; what does P + R - Q mean?",
                a: "P is the brother of R, and R is the sister of Q. Therefore, P is the brother of Q.",
              },
            ]
          : [
              {
                q: "Tell me about yourself and your technical background.",
                a: "The response should clearly outline educational accomplishments, project experiences, and specific role interest with confident delivery.",
              },
              {
                q: "Explain the difference between supervised and unsupervised learning.",
                a: "Supervised learning relies on labeled training datasets (e.g., classification), whereas unsupervised learning finds hidden patterns in unlabeled data (e.g., clustering).",
              },
              {
                q: "Describe a challenging bug or architecture problem you resolved.",
                a: "Using the STAR method: describe the Situation, Task, Action taken, and the positive, quantifiable Result of the fix.",
              },
              {
                q: "How do you ensure code quality and system performance in your projects?",
                a: "Through rigorous code reviews, automated unit testing, load balancing, profiling, and adhering to strict clean architecture principles.",
              },
            ];

      const n = questions.length;
      questions.forEach((q, idx) => {
        let qScore = score;
        if (score > 0 && n > 1) {
          if (idx === 0) qScore = Math.min(100, score + 10);
          else if (idx === 1) qScore = Math.max(0, score - 10);
        }

        generatedResults.push({
          question: q,
          answer:
            qScore >= 70
              ? "Provided comprehensive explanation matching industrial best-practices and optimal parameters."
              : qScore >= 45
                ? "Answered partially with minor gaps in details or edge-case handling."
                : "Response lacked depth, structure, or correct technical keywords.",
          evaluation: {
            score: qScore,
            breakdown: {
              keyword: Math.round(qScore * 0.95),
              completeness: Math.round(qScore * 0.92),
              relevance: Math.round(qScore * 0.98),
              structure: Math.round(qScore * 0.9),
            },
          },
        });
      });
      a.questionResults = generatedResults;
    }

    // Grade
    const gradeEl = document.getElementById("result-grade");
    gradeEl.textContent = a.grade;
    gradeEl.className =
      "results-grade grade-" +
      (a.grade.startsWith("A")
        ? "a"
        : a.grade === "B"
          ? "b"
          : a.grade === "C"
            ? "c"
            : a.grade === "D"
              ? "d"
              : "f");

    document.getElementById("result-score").textContent =
      a.totalScore + " / 100";
    document.getElementById("result-summary").textContent =
      a.totalScore >= 80
        ? "Outstanding performance! You're well-prepared."
        : a.totalScore >= 60
          ? "Good performance with room for improvement."
          : a.totalScore >= 40
            ? "Average performance. More practice needed."
            : "Needs significant improvement. Keep practicing!";

    // Metrics
    document.getElementById("result-questions").textContent =
      a.questionsAnswered;
    document.getElementById("result-communication").textContent =
      a.communicationScore + "%";
    document.getElementById("result-time").textContent =
      Math.round(a.avgResponseTime) + "s";
    document.getElementById("result-violations").textContent = (
      sessionData.violations || []
    ).length;

    // Strengths & Weaknesses
    document.getElementById("result-strengths").innerHTML = a.strengths
      .map(
        (s) =>
          `<span class="badge badge-success" style="margin:2px">✓ ${s}</span>`,
      )
      .join("");
    document.getElementById("result-weaknesses").innerHTML = a.weaknesses
      .map(
        (w) =>
          `<span class="badge badge-danger" style="margin:2px">△ ${w}</span>`,
      )
      .join("");

    // Question review
    const reviewEl = document.getElementById("question-reviews");
    reviewEl.innerHTML = a.questionResults
      .map((r, i) => {
        let cls =
          r.evaluation.score >= 70
            ? "correct"
            : r.evaluation.score >= 45
              ? "partial"
              : "wrong";
        if (sessionData.isTerminated) {
          cls = r.isActuallyCorrect ? "correct" : "wrong";
        }
        return `<div class="question-review ${cls}">
        <div class="question-review-q">Q${i + 1}: ${r.question.q} <span class="badge badge-${cls === "correct" ? "success" : cls === "partial" ? "warning" : "danger"}">${r.evaluation.score}/100</span></div>
        <div class="question-review-a"><strong>Your answer:</strong> ${r.answer || "<em>Skipped</em>"}</div>
        <div class="question-review-ideal"><strong>Ideal:</strong> ${r.question.a}</div>
      </div>`;
      })
      .join("");

    // Charts
    setTimeout(() => {
      if (a.questionResults.length > 0) {
        Analytics.drawBarChart(
          "result-bar-chart",
          a.questionResults.map((_, i) => `Q${i + 1}`),
          a.questionResults.map((r) => r.evaluation.score),
        );
        const bkd = a.questionResults.reduce(
          (acc, r) => {
            acc.keyword += r.evaluation.breakdown.keyword;
            acc.completeness += r.evaluation.breakdown.completeness;
            acc.relevance += r.evaluation.breakdown.relevance;
            acc.structure += r.evaluation.breakdown.structure;
            return acc;
          },
          { keyword: 0, completeness: 0, relevance: 0, structure: 0 },
        );
        const n = a.questionResults.length;
        Analytics.drawRadarChart(
          "result-radar-chart",
          ["Keywords", "Completeness", "Relevance", "Structure", "Confidence"],
          [
            bkd.keyword / n,
            bkd.completeness / n,
            bkd.relevance / n,
            bkd.structure / n,
            a.avgConfidence,
          ],
        );
      }
    }, 400);

    // Confetti for good scores
    if (a.totalScore >= 70) UI.showConfetti();
  }

  // Download report
  window.downloadReport = function () {
    if (currentSessionData) PDFReport.generate(currentSessionData);
    else UI.toast("No report data available", "warning");
  };

  // View result from history
  function _viewResult(id) {
    const interview = Storage.getInterviewById(id);
    if (interview && interview.analysis) _showResults(interview);
    else UI.toast("Interview data not found", "warning");
  }
  window.viewResult = _viewResult;

  // ══════════ HISTORY ══════════
  window._currentHistoryDrive = null;
  function _renderHistory() {
    const drives = Storage.getHiringDrives();
    const driveListEl = document.getElementById("history-drives-list");

    if (drives.length === 0) {
      if (driveListEl)
        driveListEl.innerHTML =
          '<div style="color:var(--text-muted); font-size:13px;">No drives available</div>';
    } else {
      if (!window._currentHistoryDrive)
        window._currentHistoryDrive = drives[drives.length - 1].title;

      if (driveListEl) {
        driveListEl.innerHTML = drives
          .map((d) => {
            const isActive = d.title === window._currentHistoryDrive;
            return `<div onclick="window._currentHistoryDrive='${d.title}'; App.renderHistory();" style="cursor:pointer; padding: 12px; border-radius: 8px; background: ${isActive ? "var(--primary-500)" : "rgba(255,255,255,0.05)"}; color: ${isActive ? "#fff" : "var(--text-secondary)"}; border: 1px solid ${isActive ? "var(--primary-400)" : "rgba(255,255,255,0.1)"}; transition: all 0.2s;">
            <div style="font-weight:600; font-size:14px;">${d.title}</div>
            <div style="font-size:12px; opacity:0.8;">${d.date}</div>
          </div>`;
          })
          .join("");
      }
    }

    const titleEl = document.getElementById("history-drive-title");
    if (titleEl) {
      titleEl.textContent = window._currentHistoryDrive
        ? `Reports: ${window._currentHistoryDrive}`
        : "Interview History";
    }

    // Filter interviews by the selected drive (if driveTitle was saved in them)
    // For backwards compatibility, if an interview has no driveTitle, we can show it when no drive is selected, or just show all if no drive.
    let interviews = Storage.getInterviews();
    if (window._currentHistoryDrive) {
      interviews = interviews.filter(
        (i) => i.driveTitle === window._currentHistoryDrive || !i.driveTitle,
      );
    }

    const listEl = document.getElementById("history-list");

    if (interviews.length === 0) {
      if (listEl)
        listEl.innerHTML =
          '<div class="empty-state"><div class="empty-state-icon"><svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div class="empty-state-title">No interview history</div><div class="empty-state-desc">Complete your first interview to see it here.</div></div>';
      return;
    }

    if (listEl) {
      listEl.innerHTML = interviews
        .map((i) => {
          const scoreColor =
            i.score >= 70
              ? "var(--success-400)"
              : i.score >= 45
                ? "var(--warning-400)"
                : "var(--danger-400)";
          return `<div class="history-item" onclick="viewResult('${i.id}')">
          <div class="history-score" style="color:${scoreColor}">${i.score || 0}</div>
          <div class="history-info"><div class="history-domain">${i.domain || "Mixed"} <span style="font-size:11px; color:var(--text-tertiary); margin-left:8px;">(${i.candidateName || "Candidate"})</span></div>
          <div class="history-meta"><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${UI.formatDate(i.timestamp)}</span><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${Math.round((i.duration || 0) / 60)} min</span><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> ${i.questionsAnswered || 0} Qs</span></div></div>
          <span class="badge badge-${i.score >= 70 ? "success" : i.score >= 45 ? "warning" : "danger"}">${i.grade || "--"}</span></div>`;
        })
        .join("");
    }

    // Domain chart
    setTimeout(() => {
      const stats = Storage.getStats();
      const domains = Object.keys(stats.domainStats);
      if (domains.length > 0) {
        Analytics.drawPieChart(
          "history-pie-chart",
          domains,
          domains.map((d) => stats.domainStats[d].count),
        );
      }

      if (interviews.length > 0) {
        const textEl = document.getElementById("history-stats-text");
        const containerEl = document.getElementById(
          "history-stats-chart-container",
        );
        if (textEl && containerEl) {
          textEl.style.display = "none";
          containerEl.style.display = "block";

          // Sort chronologically for trend line
          const sorted = [...interviews].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
          );
          const labels = sorted.map((i, index) => `Exam ${index + 1}`);
          const values = sorted.map((i) => i.score || 0);

          Analytics.drawLineChart("history-stats-chart", labels, values);
        }
      }
    }, 300);
  }

  // ══════════ PRACTICE ══════════
  function _renderPractice() {
    const domains = QuestionBank.getDomains();
    const container = document.getElementById("practice-domains");

    container.innerHTML = domains
      .map((d) => {
        const qs = QuestionBank.getByDomain(d);
        return `<div class="domain-card card-interactive" onclick="showPracticeQuestions('${d}')">
        <div class="domain-card-icon"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg></div>
        <div class="domain-card-title">${d}</div>
        <div class="domain-card-desc">${qs.length} practice questions</div></div>`;
      })
      .join("");
  }

  window.showPracticeQuestions = function (domain) {
    const qs = QuestionBank.getByDomain(domain);
    const container = document.getElementById("practice-questions");
    const title = document.getElementById("practice-domain-title");
    title.textContent = domain + " Questions";
    document.getElementById("practice-list-view").classList.remove("hidden");

    container.innerHTML = qs
      .map((q, i) => {
        const diffLabel = q.df === 1 ? "Easy" : q.df === 2 ? "Medium" : "Hard";
        const diffColor =
          q.df === 1 ? "success" : q.df === 2 ? "warning" : "danger";
        return `<div class="card" style="margin-bottom:12px;cursor:pointer" onclick="this.querySelector('.practice-answer').classList.toggle('hidden')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <strong style="flex:1">Q${i + 1}: ${q.q}</strong>
          <span class="badge badge-${diffColor}">${diffLabel}</span>
        </div>
        <div class="practice-answer hidden" style="margin-top:12px;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);border-left:3px solid var(--primary-500)">
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:8px"><strong>Answer:</strong> ${q.a}</p>
          <p style="font-size:var(--text-xs);color:var(--primary-400)"><strong>Keywords:</strong> ${q.k.join(", ")}</p>
          ${q.h ? `<p style="font-size:var(--text-xs);color:var(--warning-400);margin-top:4px"><strong>Hint:</strong> ${q.h}</p>` : ""}
        </div></div>`;
      })
      .join("");
  };

  window.backToPractice = function () {
    document.getElementById("practice-list-view").classList.add("hidden");
  };

  // ══════════ SETTINGS ══════════
  function _renderSettings() {
    const settings = Storage.getSettings();
    document.getElementById("setting-voice").checked = settings.voiceEnabled;
    document.getElementById("setting-webcam").checked = settings.webcamEnabled;
    document.getElementById("setting-face").checked =
      settings.faceDetectionEnabled;
    document.getElementById("setting-fullscreen").checked =
      settings.fullscreenMode;
    document.getElementById("setting-sound").checked = settings.soundEffects;
  }

  window.updateSetting = function (key, value) {
    Storage.updateSettings({ [key]: value });
    UI.toast("Setting updated", "success");
  };

  window.exportData = function () {
    Storage.exportData();
    UI.toast("Data exported", "success");
  };
  window.clearAllData = function () {
    UI.confirm(
      "This will delete ALL interview history, candidates, and recruitment drives. Are you sure?",
    ).then((ok) => {
      if (ok) {
        Storage.clearAllInterviews();
        UI.toast("All data cleared successfully.", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  };

  // Answer input char counter
  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("answer-input");
    if (input) {
      input.addEventListener("input", () => {
        document.getElementById("char-count").textContent = input.value.length;
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.ctrlKey) window.submitAnswer();
      });
    }
  });

  // Back to dashboard from results
  window.backToDashboard = function () {
    navigateTo("dashboard");
    location.hash = "dashboard";
  };

  // ── Enterprise Pipeline Leaderboard & Tie-Breaker Engine ──
  function _renderPipelineLeaderboard() {
    const roundSelect = document.getElementById("leaderboard-round-select");
    if (!roundSelect) return;
    const roundNum = parseInt(roundSelect.value) || 1;
    const body = document.getElementById("pipeline-leaderboard-body");
    if (!body) return;

    const candidates = Storage.getAllCandidates() || [];
    const participants = candidates.filter(
      (c) => c.roundResults && c.roundResults[roundNum],
    );

    if (participants.length === 0) {
      body.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted); font-size:13px;">No candidate results found for this round.</td></tr>`;
      return;
    }

    participants.sort((a, b) => {
      const resA = a.roundResults[roundNum];
      const resB = b.roundResults[roundNum];
      const scoreA = resA.score || resA.percentage || 0;
      const scoreB = resB.score || resB.percentage || 0;

      if (scoreB !== scoreA) return scoreB - scoreA;

      if (roundNum === 1 || roundNum === 2) {
        const timeA = resA.timeTakenMs || resA.timeTaken || 9999999;
        const timeB = resB.timeTakenMs || resB.timeTaken || 9999999;
        return timeA - timeB;
      } else {
        const confA = resA.confidence || 0;
        const confB = resB.confidence || 0;
        if (confB !== confA) return confB - confA;
        return (resB.depth || 0) - (resA.depth || 0);
      }
    });

    body.innerHTML = participants
      .map((c, index) => {
        const res = c.roundResults[roundNum];
        const isShortlisted = c.shortlistLevel > roundNum;
        const score = res.score || res.percentage || 0;

        let tieBreakerStr = "";
        const violationsCount = (res.violations || []).length;
        const violationsBadge =
          violationsCount > 0
            ? `<span class="badge badge-danger" style="margin-left: 8px;">${violationsCount} Violations</span>`
            : `<span class="badge badge-success" style="margin-left: 8px;">Clean</span>`;

        if (res.status === "in-progress") {
          tieBreakerStr =
            `<span style="color:var(--warning-400); font-weight:bold; animation:pulse 1.5s infinite;">⚡ Active Exam / In Progress</span>` +
            violationsBadge;
        } else if (res.status === "terminated") {
          tieBreakerStr =
            `<span style="color:var(--danger-400); font-weight:bold;">🚫 Terminated due to Violations</span>` +
            violationsBadge;
        } else {
          if (roundNum === 1) {
            const seconds = Math.round(
              (res.timeTakenMs || res.timeTaken * 1000) / 1000,
            );
            tieBreakerStr =
              `Time Taken: <strong>${seconds}s</strong> (Precise: ${(res.timeTakenMs || 0).toFixed(0)}ms)` +
              violationsBadge;
          } else if (roundNum === 2) {
            const seconds = Math.round(
              (res.timeTakenMs || res.timeTaken * 1000) / 1000,
            );
            tieBreakerStr =
              `Time Optimal: <strong>${seconds}s</strong>` + violationsBadge;
          } else {
            tieBreakerStr =
              `Voice Confidence: <strong>${res.confidence || 75}%</strong> • Speech Depth: <strong>${res.depth || 0} words</strong>` +
              violationsBadge;
          }
        }

        return `
        <tr style="border-bottom:1px solid var(--border-primary); transition:background 0.2s;" onmouseover="this.style.background='var(--bg-glass)'" onmouseout="this.style.background='transparent'">
          <td style="padding:16px; font-weight:800; font-family:var(--font-mono); color:${index === 0 ? "#fbbf24" : index === 1 ? "#cbd5e1" : index === 2 ? "#b45309" : "var(--text-tertiary)"}; font-size:16px;">
            #${index + 1}
          </td>
          <td style="padding:16px;">
            <div style="font-weight:600; color:var(--text-primary);">${c.name || c.email}</div>
            <div style="font-size:11px; color:var(--text-tertiary);">${c.email}</div>
          </td>
          <td style="padding:16px; font-weight:700; color:var(--primary-400); font-size:15px;">
            ${score}%
          </td>
          <td style="padding:16px; font-size:13px; color:var(--text-secondary);">
            ${tieBreakerStr}
          </td>
          <td style="padding:16px;">
            <span class="badge badge-${isShortlisted ? "success" : c.status === "rejected" ? "danger" : "primary"}">
              ${isShortlisted ? "Shortlisted" : c.status === "rejected" ? "Rejected" : "Pending Shortlist"}
            </span>
          </td>
          <td style="padding:16px;">
            ${
              isShortlisted
                ? `<button class="btn btn-ghost btn-sm" disabled style="opacity:0.6;">✓ Shortlisted</button>`
                : c.status === "rejected"
                  ? `<span style="color:var(--danger-400); font-size:12px; font-weight:700;">Rejected</span>`
                  : `<div style="display:flex; gap:8px;">
                <button onclick="App.shortlistCandidateManual('${c.email}', ${roundNum})" class="btn btn-primary btn-sm" style="padding:4px 12px; font-size:11px;">Shortlist →</button>
                <button onclick="App.rejectCandidateManual('${c.email}', ${roundNum})" class="btn btn-danger btn-sm" style="padding:4px 12px; font-size:11px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:var(--danger-400);">Reject</button>
              </div>`
            }
          </td>
        </tr>
      `;
      })
      .join("");
  }

  function _shortlistCandidateManual(email, roundNum) {
    const cData = Storage.getCandidateData(email);
    cData.shortlistLevel = roundNum + 1;
    if (cData.status === "rejected") {
      delete cData.status;
      delete cData.failedRound;
      delete cData.disqualified;
      delete cData.disqualificationReason;
    }
    Storage.saveCandidateData(email, cData);
    UI.toast(
      `Candidate ${email} successfully promoted to Round ${roundNum + 1}!`,
      "success",
    );
    _renderPipelineLeaderboard();
  }

  function _rejectCandidateManual(email, roundNum) {
    const cData = Storage.getCandidateData(email);
    cData.status = "rejected";
    cData.failedRound = roundNum;
    Storage.saveCandidateData(email, cData);
    UI.toast(`Candidate ${email} marked as not shortlisted.`, "warning");
    _renderPipelineLeaderboard();
  }

  function _autoShortlistTopCandidates() {
    const roundSelect = document.getElementById("leaderboard-round-select");
    if (!roundSelect) return;
    const roundNum = parseInt(roundSelect.value) || 1;

    const candidates = Storage.getAllCandidates() || [];
    const participants = candidates.filter(
      (c) => c.roundResults && c.roundResults[roundNum],
    );

    if (participants.length === 0) {
      UI.toast("No candidate results found for this round.", "warning");
      return;
    }

    participants.sort((a, b) => {
      const resA = a.roundResults[roundNum];
      const resB = b.roundResults[roundNum];
      const scoreA = resA.score || resA.percentage || 0;
      const scoreB = resB.score || resB.percentage || 0;

      if (scoreB !== scoreA) return scoreB - scoreA;

      if (roundNum === 1 || roundNum === 2) {
        const timeA = resA.timeTakenMs || resA.timeTaken || 9999999;
        const timeB = resB.timeTakenMs || resB.timeTaken || 9999999;
        return timeA - timeB;
      } else {
        const confA = resA.confidence || 0;
        const confB = resB.confidence || 0;
        if (confB !== confA) return confB - confA;
        return (resB.depth || 0) - (resA.depth || 0);
      }
    });

    const pending = participants.filter(
      (c) => c.shortlistLevel === roundNum || c.status === "rejected",
    );
    if (pending.length === 0) {
      UI.toast(
        "No pending candidates left to shortlist in this round.",
        "info",
      );
      return;
    }

    const top3 = pending.slice(0, 3);
    top3.forEach((c) => {
      c.shortlistLevel = roundNum + 1;
      if (c.status === "rejected") {
        delete c.status;
        delete c.failedRound;
        delete c.disqualified;
        delete c.disqualificationReason;
      }
      Storage.saveCandidateData(c.email, c);
    });

    // Auto-reject everyone else who is still pending in this round!
    pending.slice(3).forEach((c) => {
      c.status = "rejected";
      c.failedRound = roundNum;
      Storage.saveCandidateData(c.email, c);
    });

    UI.toast(
      `Successfully auto-shortlisted the top ${top3.length} ranked candidate(s) and auto-rejected the rest!`,
      "success",
    );
    _renderPipelineLeaderboard();
  }

  function _renderInterviewerDrives() {
    const grid = document.getElementById("interviewer-drives-grid");
    if (!grid) return;

    let drives = Storage.getHiringDrives();
    if (drives.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 40px; margin-bottom: 12px;">📁</div>
          <h4>No Recruitment Drives Created Yet</h4>
          <p style="font-size: 13px; color: var(--text-tertiary); margin-top: 6px;">Click the button above to launch your first hiring campaign.</p>
        </div>
      `;
      return;
    }

    const candidates = Storage.getAllCandidates() || [];

    grid.innerHTML = drives
      .map((drive) => {
        // Calculate Drive Stats
        const driveCandidates = candidates.filter((c) => {
          const progress = c.drivesProgress && c.drivesProgress[drive.title];
          return (
            progress &&
            (progress.shortlistLevel > 1 ||
              Object.keys(progress.roundResults || {}).length > 0 ||
              progress.status === "rejected" ||
              progress.disqualified)
          );
        });
        const candCount = driveCandidates.length;

        // Determine Drive Status
        const status = drive.status || "Scheduled";
        let statusClass = "success";
        if (status === "Ongoing") statusClass = "primary";
        else if (status === "Completed") statusClass = "success";
        else if (status === "Cancelled") statusClass = "danger";
        else statusClass = "warning";

        // Active Round: check the latest scheduled round
        let activeRoundName = "Awaiting Setup";
        if (drive.rounds && drive.rounds.length > 0) {
          const lastSchedRound = drive.rounds
            .filter((r) => r !== null && r !== undefined)
            .pop();
          if (lastSchedRound) {
            const roundNames = [
              "Aptitude",
              "Coding",
              "Spoken Technical",
              "Spoken Communication",
              "HR & Behavioral",
            ];
            activeRoundName = `Round ${lastSchedRound.num}: ${roundNames[lastSchedRound.num - 1]}`;
          }
        }

        // Completion status % (average progress of all active candidates)
        let compPercent = 0;
        if (candCount > 0) {
          let totalProgressPct = 0;
          driveCandidates.forEach((c) => {
            const progress = c.drivesProgress[drive.title];
            if (
              progress.shortlistLevel > 5 ||
              progress.status === "rejected" ||
              progress.disqualified
            ) {
              totalProgressPct += 100;
            } else {
              const roundsCompleted = Math.max(
                0,
                (progress.shortlistLevel || 1) - 1,
              );
              totalProgressPct += (roundsCompleted / 5) * 100;
            }
          });
          compPercent = Math.round(totalProgressPct / candCount);
        }

        return `
        <div class="card card-interactive" style="padding: 20px; display:flex; flex-direction:column; gap:16px; border: 1px solid var(--border-primary); position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h4 style="font-size: 16px; font-weight:700; color:var(--text-primary);">${drive.title}</h4>
              <span class="badge badge-${statusClass}" style="margin-top: 6px; display: inline-block;">${status}</span>
            </div>
            <button onclick="App.deleteDrive('${drive.id}')" class="btn btn-ghost btn-sm" style="color:var(--danger-400); padding: 4px 8px; border-radius: 6px;" title="Delete Drive">
              ✕
            </button>
          </div>
          
          <p style="font-size: 12px; color:var(--text-tertiary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; min-height: 34px;">
            ${drive.desc || "No description provided."}
          </p>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; border-top: 1px solid var(--border-primary); padding-top: 12px;">
            <div>
              <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing:0.5px;">Candidates</div>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-secondary); margin-top:2px;">👥 ${candCount}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing:0.5px;">Active Round</div>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-secondary); margin-top:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🏁 ${activeRoundName}</div>
            </div>
            <div style="grid-column: 1/-1;">
              <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing:0.5px; display:flex; justify-content:space-between;">
                <span>Completion Status</span>
                <span>${compPercent}%</span>
              </div>
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; margin-top: 6px; overflow: hidden;">
                <div style="width: ${compPercent}%; height: 100%; background: var(--success-500); border-radius: 3px; transition: width 0.3s;"></div>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid var(--border-primary); padding-top: 12px; margin-top: auto;">
            <span style="font-size: 11px; color: var(--text-tertiary);">📅 ${drive.date}</span>
            <button onclick="App.manageDriveRounds('${drive.title}')" class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size: 12px;">
              Manage Rounds →
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  function _showCreateDriveModal() {
    const content = `
      <div style="text-align: left; display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label class="form-label" style="display:block; margin-bottom:6px;">Drive Title / Name</label>
          <input type="text" id="new-drive-title" class="form-control" placeholder="e.g. TCS Recruitment Drive 2026" style="width:100%;">
        </div>
        <div>
          <label class="form-label" style="display:block; margin-bottom:6px;">Target Date</label>
          <input type="date" id="new-drive-date" class="form-control" style="width:100%;">
        </div>
        <div>
          <label class="form-label" style="display:block; margin-bottom:6px;">Description / Eligibility</label>
          <textarea id="new-drive-desc" class="form-control" placeholder="e.g. Open to B.E/B.Tech CS/IT students. CGPA > 7.5" style="width:100%; height:80px; resize:none;"></textarea>
        </div>
      </div>
    `;
    UI.showModal({
      title: "Create Recruitment Drive",
      content,
      confirmText: "Create Drive",
      onConfirm: () => {
        const title = document.getElementById("new-drive-title").value.trim();
        const date = document.getElementById("new-drive-date").value;
        const desc = document.getElementById("new-drive-desc").value.trim();

        if (!title || !date) {
          UI.toast("Please fill in both Title and Date", "danger");
          return false;
        }

        const drives = Storage.getHiringDrives();
        if (drives.find((d) => d.title.toLowerCase() === title.toLowerCase())) {
          UI.toast("A drive with this title already exists", "warning");
          return false;
        }

        const newDrive = {
          id: Date.now().toString(),
          title,
          date,
          desc,
          status: "Scheduled",
          rounds: [],
        };

        Storage.saveHiringDrive(newDrive);
        UI.toast("Recruitment Drive created successfully!", "success");
        _renderInterviewerDashboard();
      },
    });
  }

  function _deleteDrive(id) {
    UI.confirm(
      "Are you sure you want to delete this recruitment drive? This will remove all associated rounds and results permanently.",
      "Confirm Deletion",
    ).then((confirmed) => {
      if (confirmed) {
        const drives = Storage.getHiringDrives().filter((d) => d.id !== id);
        localStorage.setItem("mockInterview_drives", JSON.stringify(drives));
        UI.toast("Recruitment drive deleted.", "info");
        _renderInterviewerDashboard();
      }
    });
  }

  function _manageDriveRounds(title) {
    sessionStorage.setItem("mockai_active_drive", title);
    window.location.hash = "setup";
    navigateTo("setup");
  }

  return {
    init,
    navigateTo,
    viewResult: _viewResult,
    handleLogin,
    handleSignup,
    handleLogout,
    toggleTheme,
    setRole,
    renderHistory: _renderHistory,
    renderPipelineLeaderboard: _renderPipelineLeaderboard,
    shortlistCandidateManual: _shortlistCandidateManual,
    rejectCandidateManual: _rejectCandidateManual,
    autoShortlistTopCandidates: _autoShortlistTopCandidates,
    renderInterviewerDrives: _renderInterviewerDrives,
    showCreateDriveModal: _showCreateDriveModal,
    deleteDrive: _deleteDrive,
    manageDriveRounds: _manageDriveRounds,
    selectCandidateDrive: _selectCandidateDrive,
    deselectCandidateDrive: _deselectCandidateDrive,
  };
})();

// Global navigation helpers for HTML onclick handlers
window.goTo = function (screen) {
  location.hash = screen;
  App.navigateTo(screen);
};

// Expose navigateTo directly so HTML onclick="navigateTo(...)" works
window.navigateTo = function (screen) {
  location.hash = screen;
  App.navigateTo(screen);
};

// Initialize on load
document.addEventListener("DOMContentLoaded", function () {
  App.init();

  // Ensure hashchange works
  window.addEventListener("hashchange", function () {
    var hash = location.hash.replace("#", "");
    if (hash) App.navigateTo(hash);
  });
});
