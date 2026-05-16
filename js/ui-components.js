/* ============================================
   UI Components — Dynamic UI Rendering
   ============================================ */
const UI = (() => {
  // Toast system
  let toastContainer = null;
  function _ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }

  function toast(message, type = 'info', title = '', duration = 4000) {
    _ensureToastContainer();
    const icons = {
      success: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
      danger: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
      warning: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
      info: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.classList.add('toast-exit');setTimeout(()=>this.parentElement.remove(),300)">✕</button>`;
    toastContainer.appendChild(el);
    setTimeout(() => { el.classList.add('toast-exit'); setTimeout(() => el.remove(), 300); }, duration);
  }

  // Modal system
  function showModal(options = {}) {
    const { title, content, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'default' } = options;
    const existing = document.getElementById('app-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'app-modal-backdrop';
    backdrop.className = 'modal-backdrop active';
    backdrop.innerHTML = `
      <div class="modal">
        <button class="modal-close" id="modal-close-btn">✕</button>
        <h3 class="modal-title">${title || ''}</h3>
        <div class="modal-body">${content || ''}</div>
        <div class="modal-footer">
          ${onCancel !== false ? `<button class="btn btn-secondary" id="modal-cancel-btn">${cancelText}</button>` : ''}
          ${onConfirm ? `<button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}" id="modal-confirm-btn">${confirmText}</button>` : ''}
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('#modal-close-btn').onclick = () => { close(); if (onCancel) onCancel(); };
    const cancelBtn = backdrop.querySelector('#modal-cancel-btn');
    if (cancelBtn) cancelBtn.onclick = () => { close(); if (onCancel) onCancel(); };
    const confirmBtn = backdrop.querySelector('#modal-confirm-btn');
    if (confirmBtn) confirmBtn.onclick = () => { close(); if (onConfirm) onConfirm(); };
    backdrop.onclick = (e) => { if (e.target === backdrop) { close(); if (onCancel) onCancel(); } };
  }

  function closeModal() {
    const m = document.getElementById('app-modal-backdrop');
    if (m) m.remove();
  }

  // Confirmation dialog
  function confirm(message, title = 'Confirm') {
    return new Promise(resolve => {
      showModal({ title, content: `<p>${message}</p>`, onConfirm: () => resolve(true), onCancel: () => resolve(false) });
    });
  }

  // Loading overlay
  function showLoading(message = 'Loading...') {
    let el = document.getElementById('loading-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loading-overlay';
      el.style.cssText = 'position:fixed;inset:0;background:rgba(10,10,15,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:16px';
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="spinner spinner-lg"></div><p style="color:#94a3b8;font-size:14px">${message}</p>`;
    el.style.display = 'flex';
  }

  function hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.style.display = 'none';
  }

  // Animated counter
  function animateCounter(element, target, duration = 1000) {
    const start = parseInt(element.textContent) || 0;
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Create stat card
  function createStatCard(icon, value, label, trend = null) {
    const trendHTML = trend ? `<div class="stat-trend ${trend > 0 ? 'up' : 'down'}">${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%</div>` : '';
    return `<div class="stat-card"><div class="stat-icon">${icon}</div><div class="stat-value">${value}</div><div class="stat-label">${label}</div>${trendHTML}</div>`;
  }

  // Create domain card
  function createDomainCard(icon, title, desc, qCount, onClick) {
    const card = document.createElement('div');
    card.className = 'domain-card card-interactive';
    card.innerHTML = `
      <div class="domain-card-icon">${icon}</div>
      <div class="domain-card-title">${title}</div>
      <div class="domain-card-desc">${desc}</div>
      <div class="domain-card-meta"><span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> ${qCount} questions</span></div>`;
    if (onClick) card.onclick = onClick;
    return card;
  }

  // Security alert bar
  function showSecurityAlert(message, type = 'danger') {
    let bar = document.getElementById('security-alert-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'security-alert-bar';
      bar.className = 'security-alert-bar';
      document.body.appendChild(bar);
    }
    bar.className = `security-alert-bar ${type} visible`;
    bar.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> ${message}</span>`;
    document.body.classList.add('security-flash');
    setTimeout(() => document.body.classList.remove('security-flash'), 1000);
    setTimeout(() => bar.classList.remove('visible'), 5000);
  }

  function hideSecurityAlert() {
    const bar = document.getElementById('security-alert-bar');
    if (bar) bar.classList.remove('visible');
  }

  // Confetti effect
  function showConfetti() {
    const colors = ['#6366f1', '#a855f7', '#22c55e', '#0ea5e9', '#f97316', '#eab308', '#ec4899'];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.cssText = `left:${Math.random()*100}vw;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;background:${colors[i%colors.length]};border-radius:${Math.random()>0.5?'50%':'2px'};animation:confettiFall ${2+Math.random()*3}s linear forwards;animation-delay:${Math.random()*0.5}s`;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 5500);
    }
  }

  // Format time
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return {
    toast, showModal, closeModal, confirm, showLoading, hideLoading,
    animateCounter, createStatCard, createDomainCard,
    showSecurityAlert, hideSecurityAlert, showConfetti,
    formatTime, formatDate
  };
  /* ── Practice Cards ── */
  window.loadPracticeCards = function() {
    const filter = document.getElementById('practice-domain-filter')?.value || 'All';
    let qList = typeof QuestionBank !== 'undefined' ? QuestionBank.getAll() : [];
    
    if (filter !== 'All') {
      qList = qList.filter(q => q.d === filter || q.domain === filter);
    }
    
    const grid = document.getElementById('practice-grid');
    if(!grid) return;
    
    grid.innerHTML = qList.slice(0, 20).map(q => `
      <div class="card" style="perspective: 1000px; cursor: pointer; height: 250px;" onclick="this.querySelector('.card-inner').classList.toggle('flipped')">
        <div class="card-inner" style="position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d;">
          
          <div class="card-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: var(--space-6); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span class="badge" style="background: rgba(99,102,241,0.1); color: var(--primary-400); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${q.d || q.domain}</span>
              <h4 style="margin-top: 16px; font-size: 16px; line-height: 1.4;">${q.q || q.question}</h4>
            </div>
            <p class="text-xs text-muted text-center">Click to reveal answer</p>
          </div>

          <div class="card-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: rgba(99,102,241,0.05); border: 1px solid var(--primary-500); border-radius: var(--radius-lg); padding: var(--space-6); transform: rotateY(180deg); display: flex; flex-direction: column; overflow-y: auto;">
            <h5 style="color: var(--primary-400); margin-bottom: 8px;">Ideal Answer</h5>
            <p style="font-size: 14px; color: var(--text-secondary);">${q.ideal}</p>
          </div>

        </div>
      </div>
    `).join('');
    
    // Add CSS for flipped class
    if(!document.getElementById('flashcard-style')) {
      const style = document.createElement('style');
      style.id = 'flashcard-style';
      style.innerHTML = `.flipped { transform: rotateY(180deg); }`;
      document.head.appendChild(style);
    }
  };

  // Add loadPracticeCards to setup navigation hook
  const originalNav = window.navigateTo || window.goTo;
  window.goTo = function(screenId) {
    if(screenId === 'practice') {
      window.loadPracticeCards();
    }
    if(originalNav) originalNav(screenId);
  };
})();
