/* ============================================
   Setup Config — 5-Round Hiring Drive UI
   ============================================ */

const SetupConfig = (() => {

  const defaultActiveTopics = {
    r1: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Computer Science Fundamentals'],
    r2: ['Dynamic Programming & DSA', 'Arrays, Matrices & Strings'],
    r3: ['System Design', 'OOP Concepts', 'React/Angular/Node'],
    r4: ['Self Introduction', 'Extempore / Impromptu'],
    r5: ['Behavioral Questions', 'Situational Judgment', 'Cultural Fit']
  };

  function isDefaultActive(topic, rid) {
    return defaultActiveTopics[rid] && defaultActiveTopics[rid].includes(topic);
  }

  function topicBadges(topics, rid) {
    return topics.map(t => {
      const isAct = isDefaultActive(t, rid);
      const activeVal = isAct ? '1' : '0';
      const border = isAct ? 'var(--primary-500)' : 'rgba(255,255,255,0.15)';
      const bg = isAct ? 'rgba(59,130,246,0.15)' : 'transparent';
      const color = isAct ? 'var(--primary-300)' : 'var(--text-secondary)';

      return `<span class="topic-badge" data-round="${rid}" data-topic="${t}" data-active="${activeVal}"
        style="border:1px solid ${border};background:${bg};color:${color};padding:8px 16px;border-radius:20px;cursor:pointer;transition:all 0.2s;user-select:none;font-size:13px;display:inline-block;"
        onclick="SetupConfig.toggleTopic(this)">${t}</span>`;
    }).join('');
  }

  function toggleTopic(el) {
    const on = el.getAttribute('data-active') === '1';
    el.setAttribute('data-active', on ? '0' : '1');
    el.style.borderColor = on ? 'rgba(255,255,255,0.15)' : 'var(--primary-500)';
    el.style.background = on ? 'transparent' : 'rgba(59,130,246,0.15)';
    el.style.color = on ? 'var(--text-secondary)' : 'var(--primary-300)';
  }

  function getSelectedTopics(rid) {
    return Array.from(document.querySelectorAll(`.topic-badge[data-round="${rid}"][data-active="1"]`))
      .map(b => b.getAttribute('data-topic'));
  }

  function renderAll() {
    return header() + round1() + round2() + round3() + round4() + round5() + allocateAllBtn();
  }

  function header() {
    const activeTitle = Storage.getActiveDriveTitle();
    const allDrives = Storage.getHiringDrives();
    const drive = allDrives.find(d => d.title === activeTitle) || { title: activeTitle, date: new Date().toISOString().split('T')[0] };

    return `<div style="background:rgba(30,41,59,0.3);border:1px solid var(--border-primary);border-radius:16px;padding:28px;margin-bottom:28px;">
      <h2 style="font-size: 26px; font-weight: 800; color: #fff; text-align: center; margin-bottom: 8px;">Configure <span class="text-gradient">Hiring Drive</span></h2>
      <p style="color:var(--text-secondary);font-size:14px;margin-bottom:28px;text-align:center;">Create a 5-round autonomous recruitment pipeline for all candidates.</p>
      
      <div style="border: 1px solid rgba(34,197,94,0.3); background: rgba(34,197,94,0.02); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h4 style="display:flex;align-items:center;gap:8px;color:var(--success-400);margin-bottom:12px;font-size:15px;font-weight:700;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          Hiring Drive Schedule Allocation</h4>
        <p style="color:var(--text-tertiary);font-size:13px;margin-bottom:20px;line-height:1.5;">Select whether you want to allocate and schedule rounds individually (enforcing strict shortlisting blocks for un-shortlisted IDs) or broadcast them all at once.</p>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <div><label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Drive Title</label>
            <input type="text" id="drive-title" class="form-control" value="${drive.title}" readonly style="width:100%; opacity:0.8; background:rgba(255,255,255,0.05);"></div>
          <div><label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Drive Date</label>
            <input type="date" id="drive-date" class="form-control" value="${drive.date}" readonly style="width:100%; opacity:0.8; background:rgba(255,255,255,0.05);"></div></div>
        
        <div style="margin-bottom:8px;"><label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Schedule Allocation Mode</label>
          <select class="form-control" style="width:100%;" id="drive-mode">
            <option>Allocate &amp; Schedule Rounds Separately (Shortlist Restricted)</option>
            <option>Unified Broadcast (All Rounds Together)</option></select></div>
      </div>
    </div>`;
  }

  function round1() {
    const topics = ['Quantitative Aptitude','Logical Reasoning','Verbal Ability','Computer Science Fundamentals','Data Interpretation','General Knowledge'];
    return `<div style="background:rgba(30,41,59,0.3);border:1px solid var(--success-500);border-radius:16px;padding:28px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:22px; font-weight: 700; color: #fff;">Round 1: Aptitude Test</h3>
        <span class="badge" style="background:rgba(34,197,94,0.1);color:var(--success-400);border:1px solid rgba(34,197,94,0.2);padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;">No Camera • Open to All</span></div>
      <p style="font-size:13px;color:var(--text-tertiary);margin-bottom:20px;line-height:1.5;">MCQ-based aptitude. Shortlisted by Score (ties broken by fastest completion). All students attend. Anti-cheat active.</p>
      
      <div style="margin-bottom:20px;"><label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Topics Focus (Choose Multiple)</label>
        <div id="r1-topics" style="display:flex;gap:10px;flex-wrap:wrap;">${topicBadges(topics,'r1')}</div></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
        <div><label class="form-label">Duration (Minutes)</label><input type="number" id="r1-dur" class="form-control" value="30" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label">Questions</label><input type="number" id="r1-count" class="form-control" value="15" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label">Positive Marks</label><input type="number" id="r1-pos" class="form-control" value="4" min="1" max="100" style="width:100%; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="margin-bottom:20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <label style="font-size:13px;font-weight:600;color:var(--text-secondary);">Enable Negative Marking?</label>
        <input type="checkbox" id="r1-neg-toggle" checked onchange="document.getElementById('r1-neg-wrap').style.display=this.checked?'flex':'none'">
        <div id="r1-neg-wrap" style="display:flex;align-items:center;gap:8px;">
          <label class="form-label" style="margin:0;">Negative Marks:</label>
          <input type="number" id="r1-neg" class="form-control" value="-1" min="-100" max="-1" style="width:80px; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin-bottom:20px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
        <div><label class="form-label" style="font-size:12px;">Start Date</label><input type="date" id="r1-date" class="form-control" value="2026-05-18" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">Start Time</label><input type="time" id="r1-time" class="form-control" value="09:00" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Date (Deadline)</label><input type="date" id="r1-end-date" class="form-control" value="2026-05-18" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Time (Deadline)</label><input type="time" id="r1-end-time" class="form-control" value="10:00" style="width:100%; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-primary);padding-top:20px;">
        <span style="font-size:13px;color:var(--text-tertiary);">Status: Ready to Allocate</span>
        <button class="btn" onclick="SetupConfig.allocateRound(1)" style="background:#ffffff; color:#0f172a; border:none; border-radius:8px; font-weight:600; padding:10px 20px; box-shadow: 0 4px 12px rgba(255,255,255,0.1); cursor:pointer;">Allocate &amp; Schedule Round 1</button></div></div>`;
  }

  // ── Round 2 State ──
  let _r2Source = 'ai'; // 'ai' | 'manual'
  let _r2ApprovedQuestions = null;
  let _r2SelectedTopics = [];
  let _r2QuestionCount = 2;
  let _r2DifficultyConfig = [];
  let _manualQuestions = []; // array of question objects for manual mode

  const R2_TOPICS = [
    'Dynamic Programming & DSA',
    'Arrays, Matrices & Strings',
    'Stacks, Queues & Lists',
    'Trees, BSTs & Graphs',
    'SQL & Databases'
  ];

  function _blankManualQ(index) {
    return { title:'', difficulty:'Easy', statement:'', constraints:'', inputFormat:'', outputFormat:'', sampleInput:'', sampleOutput:'', explanation:'', visibleTests:'', hiddenTests:'' };
  }

  // ── Persistence ──
  function _r2LoadState() {
    try {
      const saved = JSON.parse(localStorage.getItem('r2_workflow_state') || 'null');
      if (saved) {
        _r2Source           = saved.source   || 'ai';
        _r2SelectedTopics   = saved.topics   || [];
        _r2QuestionCount    = saved.count    || 2;
        _r2DifficultyConfig = saved.diffs    || [];
        _r2ApprovedQuestions = saved.approved || null;
        window._r2PendingQuestions = saved.pending || null;
        _manualQuestions    = saved.manualQs || [];
      }
    } catch(e) {}
  }

  function _r2SaveState() {
    // Snapshot current manual question form data before saving
    _syncManualFormToState();
    try {
      localStorage.setItem('r2_workflow_state', JSON.stringify({
        source:   _r2Source,
        topics:   _r2SelectedTopics,
        count:    _r2QuestionCount,
        diffs:    _r2DifficultyConfig,
        approved: _r2ApprovedQuestions,
        pending:  window._r2PendingQuestions || null,
        manualQs: _manualQuestions
      }));
    } catch(e) {}
  }

  function _syncManualFormToState() {
    const blocks = document.querySelectorAll('.r2-manual-q-block');
    if (!blocks.length) return;
    blocks.forEach((block, i) => {
      if (!_manualQuestions[i]) _manualQuestions[i] = _blankManualQ(i);
      const g = id => { const el = block.querySelector(`[data-field="${id}"]`); return el ? el.value : ''; };
      _manualQuestions[i].title        = g('title');
      _manualQuestions[i].difficulty   = g('difficulty');
      _manualQuestions[i].statement    = g('statement');
      _manualQuestions[i].constraints  = g('constraints');
      _manualQuestions[i].inputFormat  = g('inputFormat');
      _manualQuestions[i].outputFormat = g('outputFormat');
      _manualQuestions[i].sampleInput  = g('sampleInput');
      _manualQuestions[i].sampleOutput = g('sampleOutput');
      _manualQuestions[i].explanation  = g('explanation');
      _manualQuestions[i].visibleTests = g('visibleTests');
      _manualQuestions[i].hiddenTests  = g('hiddenTests');
    });
  }

  function _renderManualQBlock(q, i) {
    const diff = q.difficulty || 'Easy';
    const inp = (field, placeholder, val, ta=false) => ta
      ? `<textarea class="form-control" data-field="${field}" placeholder="${placeholder}" rows="3" style="width:100%;box-sizing:border-box;resize:vertical;font-size:13px;" oninput="SetupConfig._onManualInput()">${val||''}</textarea>`
      : `<input type="text" class="form-control" data-field="${field}" placeholder="${placeholder}" value="${(val||'').replace(/"/g,'&quot;')}" style="width:100%;box-sizing:border-box;font-size:13px;" oninput="SetupConfig._onManualInput()">`;
    return `<div class="r2-manual-q-block" data-qidx="${i}" style="border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:20px;margin-bottom:16px;background:rgba(245,158,11,0.03);position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h4 style="font-size:15px;font-weight:700;color:var(--warning-300);margin:0;">📝 Question ${i+1}</h4>
        <button onclick="SetupConfig.deleteManualQuestion(${i})" style="background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;">🗑 Delete</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div><label class="form-label" style="font-size:12px;">Problem Title</label>${inp('title','e.g. Two Sum',q.title)}</div>
        <div><label class="form-label" style="font-size:12px;">Difficulty</label>
          <select class="form-control" data-field="difficulty" style="width:100%;box-sizing:border-box;font-size:13px;" onchange="SetupConfig._onManualInput()">
            <option value="Easy"${diff==='Easy'?' selected':''}>Easy</option>
            <option value="Moderate"${diff==='Moderate'?' selected':''}>Moderate</option>
            <option value="Hard"${diff==='Hard'?' selected':''}>Hard</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom:12px;"><label class="form-label" style="font-size:12px;">Problem Statement</label>${inp('statement','Describe the problem clearly...',q.statement,true)}</div>
      <div style="margin-bottom:12px;"><label class="form-label" style="font-size:12px;">Constraints</label>${inp('constraints','e.g. 1 ≤ N ≤ 10^5',q.constraints,true)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div><label class="form-label" style="font-size:12px;">Input Format</label>${inp('inputFormat','Describe input format...',q.inputFormat,true)}</div>
        <div><label class="form-label" style="font-size:12px;">Output Format</label>${inp('outputFormat','Describe output format...',q.outputFormat,true)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div><label class="form-label" style="font-size:12px;">Sample Input</label>${inp('sampleInput','',q.sampleInput,true)}</div>
        <div><label class="form-label" style="font-size:12px;">Sample Output</label>${inp('sampleOutput','',q.sampleOutput,true)}</div>
      </div>
      <div style="margin-bottom:12px;"><label class="form-label" style="font-size:12px;">Explanation</label>${inp('explanation','Explain the sample...',q.explanation,true)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label class="form-label" style="font-size:12px;">Visible Test Cases <span style="color:var(--text-tertiary);font-weight:400;">(Input|Output per line)</span></label>${inp('visibleTests','2 7 11 15\n9|0 1',q.visibleTests,true)}</div>
        <div><label class="form-label" style="font-size:12px;">Hidden Test Cases <span style="color:var(--text-tertiary);font-weight:400;">(Input|Output per line)</span></label>${inp('hiddenTests','3 3\n6|0 1',q.hiddenTests,true)}</div>
      </div>
    </div>`;
  }

  function _renderManualSection() {
    if (_manualQuestions.length === 0) _manualQuestions = [_blankManualQ(0)];
    return _manualQuestions.map((q,i) => _renderManualQBlock(q,i)).join('');
  }

  function round2() {
    _r2LoadState();
    const isAI = _r2Source !== 'manual';
    return `<div style="background:rgba(30,41,59,0.3);border:1px solid var(--warning-500);border-radius:16px;padding:28px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:22px;font-weight:700;color:#fff;">Round 2: Coding Assessment</h3>
        <span class="badge" style="background:rgba(245,158,11,0.1);color:var(--warning-400);border:1px solid rgba(245,158,11,0.2);padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;">${isAI ? '🤖 AI Topic Generator' : '📝 Manual Questions'} &bull; IDE Tracking</span>
      </div>

      <!-- Duration -->
      <div style="margin-bottom:20px;">
        <label class="form-label" style="font-size:12px;">Duration (Minutes)</label>
        <input type="number" id="r2-dur" class="form-control" value="90" style="width:180px;box-sizing:border-box;">
      </div>

      <!-- Source Toggle -->
      <div style="margin-bottom:24px;">
        <label class="form-label" style="display:block;margin-bottom:10px;font-size:13px;font-weight:600;color:var(--text-secondary);">Question Source</label>
        <div style="display:flex;gap:0;border:1px solid rgba(255,255,255,0.12);border-radius:10px;overflow:hidden;width:fit-content;">
          <button id="r2-src-ai" onclick="SetupConfig.switchR2Source('ai')" style="padding:9px 22px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;
            background:${isAI?'rgba(245,158,11,0.2)':'transparent'};
            color:${isAI?'var(--warning-300)':'var(--text-tertiary)'};">🤖 AI Generated</button>
          <button id="r2-src-manual" onclick="SetupConfig.switchR2Source('manual')" style="padding:9px 22px;font-size:13px;font-weight:600;border:none;border-left:1px solid rgba(255,255,255,0.12);cursor:pointer;transition:all 0.2s;
            background:${!isAI?'rgba(245,158,11,0.2)':'transparent'};
            color:${!isAI?'var(--warning-300)':'var(--text-tertiary)'};">📝 Manual Questions</button>
        </div>
      </div>

      <!-- AI Section -->
      <div id="r2-ai-section" style="display:${isAI?'block':'none'};">
        <div style="margin-bottom:20px;">
          <label class="form-label" style="display:block;margin-bottom:10px;font-size:13px;font-weight:600;color:var(--text-secondary);">Step 1 — Select Topic(s) <span style="font-size:11px;color:var(--text-tertiary);font-weight:400;">(click to toggle)</span></label>
          <div id="r2-topic-badges" style="display:flex;gap:10px;flex-wrap:wrap;">
            ${R2_TOPICS.map(t => {
              const sel = _r2SelectedTopics.includes(t);
              return `<span class="r2-topic-badge" data-topic="${t}" onclick="SetupConfig.toggleR2Topic(this)" style="padding:8px 18px;border-radius:20px;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.18s;user-select:none;border:1px solid ${sel?'var(--warning-500)':'rgba(255,255,255,0.15)'};background:${sel?'rgba(245,158,11,0.18)':'transparent'};color:${sel?'var(--warning-300)':'var(--text-secondary)'}">${t}</span>`;
            }).join('')}
          </div>
          <div id="r2-topic-err" style="display:none;margin-top:8px;font-size:12px;color:#f87171;">⚠ Please select at least one topic.</div>
        </div>
        <div style="margin-bottom:20px;">
          <label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Step 2 — Total Number of Questions</label>
          <div style="display:flex;align-items:center;gap:12px;">
            <select id="r2-count-dropdown" class="form-control" style="width:120px;box-sizing:border-box;" onchange="SetupConfig.onR2CountChange(this.value)">
              <option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="5">5</option><option value="10">10</option><option value="custom">Custom...</option>
            </select>
            <input type="number" id="r2-count-custom" class="form-control" placeholder="Enter count" min="1" max="50" style="width:130px;box-sizing:border-box;display:${(_r2QuestionCount>0&&![1,2,3,5,10].includes(_r2QuestionCount))?'block':'none'};" oninput="SetupConfig.onR2CustomCountInput(this.value)">
            <span style="font-size:12px;color:var(--text-tertiary);">questions total</span>
          </div>
        </div>
        <div id="r2-diff-section" style="margin-bottom:20px;${_r2DifficultyConfig.length===0?'display:none;':''}">
          <label class="form-label" style="display:block;margin-bottom:10px;font-size:13px;font-weight:600;color:var(--text-secondary);">Step 3 — Set Difficulty Per Question</label>
          <div id="r2-diff-rows" style="display:flex;flex-direction:column;gap:8px;">
            ${_r2DifficultyConfig.map((d,i) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;"><span style="font-size:13px;font-weight:600;color:var(--warning-300);min-width:90px;">Question ${i+1}</span><select class="form-control r2-q-diff" style="width:140px;box-sizing:border-box;" onchange="SetupConfig.onR2DiffChange(${i},this.value)"><option value="Easy"${d==='Easy'?' selected':''}>Easy</option><option value="Moderate"${d==='Moderate'?' selected':''}>Moderate</option><option value="Hard"${d==='Hard'?' selected':''}>Hard</option></select></div>`).join('')}
          </div>
        </div>
        <div style="text-align:center;margin-bottom:20px;">
          <button id="r2-generate-btn" onclick="SetupConfig.generateR2Questions()" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f172a;border:none;border-radius:10px;font-weight:700;padding:12px 32px;font-size:14px;cursor:pointer;box-shadow:0 4px 16px rgba(245,158,11,0.3);">🤖 Generate Questions with AI</button>
        </div>
        <div id="r2-review-panel" style="display:${(window._r2PendingQuestions&&window._r2PendingQuestions.length>0)?'block':'none'};border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:20px;margin-bottom:20px;background:rgba(245,158,11,0.04);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h4 style="font-size:15px;font-weight:700;color:var(--warning-300);margin:0;">🔍 AI Generated Questions — Review</h4>
            <div style="display:flex;gap:10px;">
              <button onclick="SetupConfig.generateR2Questions()" style="background:rgba(255,255,255,0.07);color:var(--text-secondary);border:1px solid var(--border-primary);border-radius:8px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;">↺ Regenerate</button>
              <button id="r2-approve-btn" onclick="SetupConfig.approveR2Questions()" style="background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;">${_r2ApprovedQuestions?'✅ Approved':'✓ Approve Questions'}</button>
            </div>
          </div>
          <div id="r2-question-list" style="display:flex;flex-direction:column;gap:10px;">${(window._r2PendingQuestions||[]).map((q,i)=>`<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;"><span style="background:rgba(245,158,11,0.2);color:var(--warning-300);border-radius:6px;padding:3px 9px;font-size:12px;font-weight:700;white-space:nowrap;">Q${i+1}</span><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;">${q.title}</div><div style="display:flex;gap:8px;"><span style="font-size:11px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.07);color:var(--text-tertiary);">${q.topic||'General'}</span><span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${q.difficulty==='Easy'?'rgba(34,197,94,0.15)':q.difficulty==='Hard'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)'};color:${q.difficulty==='Easy'?'#4ade80':q.difficulty==='Hard'?'#f87171':'#fbbf24'}">${q.difficulty}</span></div><p style="font-size:12px;color:var(--text-tertiary);margin:6px 0 0;">${(q.statement||'').substring(0,120)}${(q.statement||'').length>120?'...':''}</p></div></div>`).join('')}</div>
          <div id="r2-approved-badge" style="display:${_r2ApprovedQuestions?'block':'none'};margin-top:12px;padding:10px 14px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#4ade80;">✅ Questions Approved! You can now Allocate the Round.</div>
        </div>
      </div>

      <!-- Manual Section -->
      <div id="r2-manual-section" style="display:${!isAI?'block':'none'};">
        <div style="margin-bottom:16px;">
          <label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Number of Questions</label>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <select id="r2-manual-count-dropdown" class="form-control" style="width:120px;box-sizing:border-box;" onchange="SetupConfig.onManualCountChange(this.value)">
              <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="5">5</option><option value="10">10</option><option value="custom">Custom...</option>
            </select>
            <input type="number" id="r2-manual-count-custom" class="form-control" placeholder="Enter count" min="1" max="50" style="width:130px;box-sizing:border-box;display:none;" oninput="SetupConfig.onManualCountCustomInput(this.value)">
            <span style="font-size:12px;color:var(--text-tertiary);">questions</span>
          </div>
        </div>
        <div id="r2-manual-blocks">${_renderManualSection()}</div>
        <button onclick="SetupConfig.addManualQuestion()" style="background:rgba(245,158,11,0.1);color:var(--warning-300);border:1px dashed rgba(245,158,11,0.4);border-radius:10px;padding:11px 24px;font-size:14px;font-weight:600;cursor:pointer;width:100%;margin-bottom:4px;">+ Add Question</button>
      </div>

      <!-- Schedule -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin-bottom:20px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;margin-top:20px;">
        <div><label class="form-label" style="font-size:12px;">Start Date</label><input type="date" id="r2-date" class="form-control" value="2026-05-18" style="width:100%;box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">Start Time</label><input type="time" id="r2-time" class="form-control" value="11:00" style="width:100%;box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Date (Deadline)</label><input type="date" id="r2-end-date" class="form-control" value="2026-05-18" style="width:100%;box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Time (Deadline)</label><input type="time" id="r2-end-time" class="form-control" value="13:00" style="width:100%;box-sizing:border-box;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-primary);padding-top:20px;">
        <span style="font-size:13px;color:var(--text-tertiary);">${isAI?'Select topics → count → difficulty → generate → approve.':'Configure questions manually, then allocate.'}</span>
        <button class="btn" onclick="SetupConfig.allocateRound(2)" style="background:#ffffff;color:#0f172a;border:none;border-radius:8px;font-weight:600;padding:10px 20px;box-shadow:0 4px 12px rgba(255,255,255,0.1);cursor:pointer;">Allocate &amp; Schedule Round 2</button>
      </div>
    </div>`;
  }

  // ── Switch between AI and Manual source ──
  function switchR2Source(src) {
    _syncManualFormToState();
    _r2Source = src;
    _r2SaveState();
    const aiSec = document.getElementById('r2-ai-section');
    const manSec = document.getElementById('r2-manual-section');
    const aiBtnEl = document.getElementById('r2-src-ai');
    const manBtnEl = document.getElementById('r2-src-manual');
    if (aiSec)  aiSec.style.display  = src === 'ai' ? 'block' : 'none';
    if (manSec) manSec.style.display = src === 'manual' ? 'block' : 'none';
    if (aiBtnEl)  { aiBtnEl.style.background  = src==='ai'?'rgba(245,158,11,0.2)':'transparent';  aiBtnEl.style.color  = src==='ai'?'var(--warning-300)':'var(--text-tertiary)'; }
    if (manBtnEl) { manBtnEl.style.background = src==='manual'?'rgba(245,158,11,0.2)':'transparent'; manBtnEl.style.color = src==='manual'?'var(--warning-300)':'var(--text-tertiary)'; }
  }

  // ── Manual question helpers ──
  function _onManualInput() { _r2SaveState(); }

  function _reRenderManualBlocks() {
    const container = document.getElementById('r2-manual-blocks');
    if (!container) return;
    container.innerHTML = _manualQuestions.map((q,i) => _renderManualQBlock(q,i)).join('');
  }

  function addManualQuestion() {
    _syncManualFormToState();
    _manualQuestions.push(_blankManualQ(_manualQuestions.length));
    _reRenderManualBlocks();
    _r2SaveState();
    // Scroll to the new block
    const blocks = document.querySelectorAll('.r2-manual-q-block');
    if (blocks.length) blocks[blocks.length-1].scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function deleteManualQuestion(idx) {
    if (!confirm(`Are you sure you want to delete Question ${idx+1}?`)) return;
    _syncManualFormToState();
    _manualQuestions.splice(idx, 1);
    if (_manualQuestions.length === 0) _manualQuestions.push(_blankManualQ(0));
    _reRenderManualBlocks();
    _r2SaveState();
    UI.toast(`Question ${idx+1} deleted. Questions renumbered.`, 'success');
  }

  function onManualCountChange(val) {
    const customInput = document.getElementById('r2-manual-count-custom');
    if (val === 'custom') { customInput.style.display='block'; customInput.focus(); return; }
    customInput.style.display = 'none';
    _applyManualCount(parseInt(val));
  }

  function onManualCountCustomInput(val) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 1 && n <= 50) _applyManualCount(n);
  }

  function _applyManualCount(newCount) {
    _syncManualFormToState();
    const current = _manualQuestions.length;
    if (newCount < current) {
      if (!confirm(`You are reducing the question count from ${current} to ${newCount}.\nThe last ${current-newCount} question(s) will be removed.\nContinue?`)) return;
      _manualQuestions.splice(newCount);
    } else {
      while (_manualQuestions.length < newCount) _manualQuestions.push(_blankManualQ(_manualQuestions.length));
    }
    _reRenderManualBlocks();
    _r2SaveState();
  }

  // ── Toggle a topic badge ──
  function toggleR2Topic(el) {
    const topic = el.getAttribute('data-topic');
    const idx = _r2SelectedTopics.indexOf(topic);
    if (idx === -1) {
      _r2SelectedTopics.push(topic);
      el.style.borderColor = 'var(--warning-500)';
      el.style.background  = 'rgba(245,158,11,0.18)';
      el.style.color        = 'var(--warning-300)';
    } else {
      _r2SelectedTopics.splice(idx, 1);
      el.style.borderColor = 'rgba(255,255,255,0.15)';
      el.style.background  = 'transparent';
      el.style.color        = 'var(--text-secondary)';
    }
    // Hide the error message as soon as at least one topic is selected
    const errEl = document.getElementById('r2-topic-err');
    if (errEl) errEl.style.display = _r2SelectedTopics.length === 0 ? 'block' : 'none';
    _r2ApprovedQuestions = null;
    _r2SaveState();
  }

  // ── Handle count dropdown change ──
  function onR2CountChange(val) {
    const customInput = document.getElementById('r2-count-custom');
    if (val === 'custom') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
      _r2QuestionCount = parseInt(val);
      _r2BuildDiffRows(_r2QuestionCount);
      _r2SaveState();
    }
  }

  function onR2CustomCountInput(val) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 1 && n <= 50) {
      _r2QuestionCount = n;
      _r2BuildDiffRows(n);
      _r2SaveState();
    }
  }

  // ── Build per-question difficulty rows ──
  function _r2BuildDiffRows(count) {
    // Preserve existing selections
    const existing = _r2DifficultyConfig.slice();
    _r2DifficultyConfig = Array.from({length: count}, (_, i) => existing[i] || 'Moderate');

    const section = document.getElementById('r2-diff-section');
    const container = document.getElementById('r2-diff-rows');
    if (!section || !container) return;

    section.style.display = 'block';
    container.innerHTML = _r2DifficultyConfig.map((d, i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;">
        <span style="font-size:13px;font-weight:600;color:var(--warning-300);min-width:90px;">Question ${i+1}</span>
        <select class="form-control r2-q-diff" data-qindex="${i}" style="width:140px;box-sizing:border-box;" onchange="SetupConfig.onR2DiffChange(${i}, this.value)">
          <option value="Easy"${d==='Easy'?' selected':''}>Easy</option>
          <option value="Moderate"${d==='Moderate'?' selected':''}>Moderate</option>
          <option value="Hard"${d==='Hard'?' selected':''}>Hard</option>
        </select>
      </div>`).join('');
  }

  function onR2DiffChange(idx, val) {
    _r2DifficultyConfig[idx] = val;
    _r2ApprovedQuestions = null;
    _r2SaveState();
  }

  // ── AI Generation (strict: follows topics + per-question difficulty) ──
  function generateR2Questions() {
    // Validate topics
    if (_r2SelectedTopics.length === 0) {
      const errEl = document.getElementById('r2-topic-err');
      if (errEl) errEl.style.display = 'block';
      UI.toast('Please select at least one topic first.', 'error');
      return;
    }

    // Validate count & difficulty config
    const count = _r2DifficultyConfig.length;
    if (count === 0) { UI.toast('Please set the number of questions first.', 'error'); return; }

    const btn = document.getElementById('r2-generate-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating...'; }

    setTimeout(() => {
      // Build per-question config: cycle through selected topics, use configured difficulty
      const configs = _r2DifficultyConfig.map((diff, i) => ({
        topic: _r2SelectedTopics[i % _r2SelectedTopics.length],
        difficulty: diff,
        count: 1
      }));

      const questions = QuestionBank.generateAITopicQuestions(configs);
      _r2ApprovedQuestions = null;
      window._r2PendingQuestions = questions;
      _r2SaveState();

      // Render review panel
      const panel = document.getElementById('r2-review-panel');
      const list  = document.getElementById('r2-question-list');
      const badge = document.getElementById('r2-approved-badge');
      const approveBtn = document.getElementById('r2-approve-btn');

      badge.style.display = 'none';
      if (approveBtn) { approveBtn.textContent = '✓ Approve Questions'; approveBtn.style.background = 'rgba(34,197,94,0.15)'; }

      list.innerHTML = questions.map((q, i) => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;">
          <span style="background:rgba(245,158,11,0.2);color:var(--warning-300);border-radius:6px;padding:3px 9px;font-size:12px;font-weight:700;white-space:nowrap;">Q${i+1}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;">${q.title}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.07);color:var(--text-tertiary);">${q.topic || 'General'}</span>
              <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${ q.difficulty==='Easy'?'rgba(34,197,94,0.15)':q.difficulty==='Hard'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)' };color:${ q.difficulty==='Easy'?'#4ade80':q.difficulty==='Hard'?'#f87171':'#fbbf24' };">${q.difficulty}</span>
            </div>
            <p style="font-size:12px;color:var(--text-tertiary);margin:6px 0 0;line-height:1.4;">${(q.statement||'').substring(0,120)}${(q.statement||'').length>120?'...':''}</p>
          </div>
        </div>`).join('');

      panel.style.display = 'block';
      if (btn) { btn.disabled = false; btn.textContent = '🤖 Generate Questions with AI'; }
      panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }, 900);
  }

  function approveR2Questions() {
    if (!window._r2PendingQuestions || window._r2PendingQuestions.length === 0) {
      UI.toast('Please generate questions first.', 'error'); return;
    }
    _r2ApprovedQuestions = window._r2PendingQuestions;
    const badge = document.getElementById('r2-approved-badge');
    const approveBtn = document.getElementById('r2-approve-btn');
    if (badge) badge.style.display = 'block';
    if (approveBtn) { approveBtn.textContent = '✅ Approved'; approveBtn.style.background = 'rgba(34,197,94,0.25)'; }
    _r2SaveState();
    UI.toast('Questions approved! Now allocate the round.', 'success');
  }

  function round3() {
    const topics = ['System Design','OOP Concepts','React/Angular/Node','API Design','Cloud & DevOps','Database Optimization'];
    return `<div style="background:rgba(30,41,59,0.3);border:1px solid var(--primary-500);border-radius:16px;padding:28px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:22px; font-weight: 700; color: #fff;">Round 3: Spoken Technical Interview</h3>
        <span class="badge" style="background:rgba(59,130,246,0.1);color:var(--primary-400);border:1px solid rgba(59,130,246,0.2);padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;">Camera Required • AI Proctored</span></div>
      <p style="font-size:13px;color:var(--text-tertiary);margin-bottom:20px;line-height:1.5;">AI-driven spoken technical interview. Evaluated on answer accuracy, depth, and confidence. System requirements check active. Full camera + face detection active.</p>
      
      <div style="margin-bottom:20px;"><label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Topics Focus (Choose Multiple)</label>
        <div id="r3-topics" style="display:flex;gap:10px;flex-wrap:wrap;">${topicBadges(topics,'r3')}</div></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div><label class="form-label">Duration (Minutes)</label><input type="number" id="r3-dur" class="form-control" value="20" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label">Number of Questions</label><input type="number" id="r3-count" class="form-control" value="8" style="width:100%; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin-bottom:20px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
        <div><label class="form-label" style="font-size:12px;">Start Date</label><input type="date" id="r3-date" class="form-control" value="2026-05-18" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">Start Time</label><input type="time" id="r3-time" class="form-control" value="14:00" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Date (Deadline)</label><input type="date" id="r3-end-date" class="form-control" value="2026-05-18" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Time (Deadline)</label><input type="time" id="r3-end-time" class="form-control" value="15:00" style="width:100%; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-primary);padding-top:20px;">
        <span style="font-size:13px;color:var(--text-tertiary);">Status: Locked (Awaiting R2 Shortlist)</span>
        <button class="btn" onclick="SetupConfig.allocateRound(3)" style="background:#ffffff; color:#0f172a; border:none; border-radius:8px; font-weight:600; padding:10px 20px; box-shadow: 0 4px 12px rgba(255,255,255,0.1); cursor:pointer;">Allocate &amp; Schedule Round 3</button></div></div>`;
  }

  function round4() {
    const topics = ['Self Introduction','Extempore / Impromptu','Presentation Skills','Storytelling','Debate & Argumentation'];
    return `<div style="background:rgba(30,41,59,0.3);border:1px solid var(--accent-500);border-radius:16px;padding:28px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:22px; font-weight: 700; color: #fff;">Round 4: Spoken Communication</h3>
        <span class="badge" style="background:rgba(168,85,247,0.1);color:var(--accent-400);border:1px solid rgba(168,85,247,0.2);padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;">Camera + Mic Required • AI Proctored</span></div>
      <p style="font-size:13px;color:var(--text-tertiary);margin-bottom:20px;line-height:1.5;">AI evaluates: Clarity, Grammar, Fluency, Confidence, Eye Contact, and Body Language. System requirement check active.</p>
      
      <div style="margin-bottom:20px;"><label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Topics Focus (Choose Multiple)</label>
        <div id="r4-topics" style="display:flex;gap:10px;flex-wrap:wrap;">${topicBadges(topics,'r4')}</div></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div><label class="form-label">Duration (Minutes)</label><input type="number" id="r4-dur" class="form-control" value="15" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label">Number of Questions</label><input type="number" id="r4-count" class="form-control" value="3" style="width:100%; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin-bottom:20px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
        <div><label class="form-label" style="font-size:12px;">Start Date</label><input type="date" id="r4-date" class="form-control" value="2026-05-18" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">Start Time</label><input type="time" id="r4-time" class="form-control" value="15:30" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Date (Deadline)</label><input type="date" id="r4-end-date" class="form-control" value="2026-05-18" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Time (Deadline)</label><input type="time" id="r4-end-time" class="form-control" value="16:15" style="width:100%; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-primary);padding-top:20px;">
        <span style="font-size:13px;color:var(--text-tertiary);">Status: Locked (Awaiting R3 Shortlist)</span>
        <button class="btn" onclick="SetupConfig.allocateRound(4)" style="background:#ffffff; color:#0f172a; border:none; border-radius:8px; font-weight:600; padding:10px 20px; box-shadow: 0 4px 12px rgba(255,255,255,0.1); cursor:pointer;">Allocate &amp; Schedule Round 4</button></div></div>`;
  }

  function round5() {
    const topics = ['Behavioral Questions','Situational Judgment','Cultural Fit','Leadership Scenarios','Career Goals'];
    return `<div style="background:rgba(30,41,59,0.3);border:1px solid var(--danger-500);border-radius:16px;padding:28px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:22px; font-weight: 700; color: #fff;">Round 5: HR / Leadership</h3>
        <span class="badge" style="background:rgba(239,68,68,0.1);color:var(--danger-400);border:1px solid rgba(239,68,68,0.2);padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;">Camera + Mic + Resume • Final Round</span></div>
      <p style="font-size:13px;color:var(--text-tertiary);margin-bottom:20px;line-height:1.5;">AI-driven behavioral interview. Candidates upload a PDF resume first. Evaluated on leadership, fit, and situational judgment.</p>
      
      <div style="margin-bottom:20px;"><label class="form-label" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">Topics Focus (Choose Multiple)</label>
        <div id="r5-topics" style="display:flex;gap:10px;flex-wrap:wrap;">${topicBadges(topics,'r5')}</div></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div><label class="form-label">Duration (Minutes)</label><input type="number" id="r5-dur" class="form-control" value="15" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label">Number of Questions</label><input type="number" id="r5-count" class="form-control" value="6" style="width:100%; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin-bottom:20px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
        <div><label class="form-label" style="font-size:12px;">Start Date</label><input type="date" id="r5-date" class="form-control" value="2026-05-18" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">Start Time</label><input type="time" id="r5-time" class="form-control" value="16:30" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Date (Deadline)</label><input type="date" id="r5-end-date" class="form-control" value="2026-05-18" style="width:100%; max-width:100%; box-sizing:border-box;"></div>
        <div><label class="form-label" style="font-size:12px;">End Time (Deadline)</label><input type="time" id="r5-end-time" class="form-control" value="17:30" style="width:100%; max-width:100%; box-sizing:border-box;"></div></div>
      
      <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:10px;margin-bottom:20px;padding:14px 18px;font-size:13px;color:var(--text-secondary);">
        <strong style="color:var(--primary-400);">📄 Resume Upload:</strong> Candidates will be required to upload their resume (PDF) before entering this round.</div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-primary);padding-top:20px;">
        <span style="font-size:13px;color:var(--text-tertiary);">Status: Locked (Awaiting R4 Shortlist)</span>
        <button class="btn" onclick="SetupConfig.allocateRound(5)" style="background:#ffffff; color:#0f172a; border:none; border-radius:8px; font-weight:600; padding:10px 20px; box-shadow: 0 4px 12px rgba(255,255,255,0.1); cursor:pointer;">Allocate &amp; Schedule Round 5</button></div></div>`;
  }

  function allocateAllBtn() {
    return `<button class="btn btn-success" style="width:100%;padding:18px;font-size:16px;margin-bottom:24px;font-weight:700;letter-spacing:0.5px;cursor:pointer;border-radius:10px;" onclick="SetupConfig.allocateAll()">✓ Allocate &amp; Schedule All 5 Rounds</button>`;
  }

  // ── Allocation Logic ──
  function allocateRound(num) {
    const driveTitle = document.getElementById('drive-title').value.trim();
    const driveDate = document.getElementById('drive-date').value;

    if (!driveTitle) {
      UI.toast('Please enter a Drive Title.', 'error');
      return false;
    }
    if (!driveDate) {
      UI.toast('Please select a Drive Date.', 'error');
      return false;
    }

    const topics = getSelectedTopics('r' + num);
    // Round 2 manages its own topic/question validation internally
    if (num !== 2 && topics.length === 0) {
      UI.toast(`Please choose at least one topic focus for Round ${num}.`, 'error');
      return false;
    }

    const dateVal = document.getElementById('r' + num + '-date')?.value;
    const timeVal = document.getElementById('r' + num + '-time')?.value;

    if (!dateVal) {
      UI.toast(`Please select a Schedule Date for Round ${num}.`, 'error');
      return false;
    }
    if (!timeVal) {
      UI.toast(`Please select a Schedule Time for Round ${num}.`, 'error');
      return false;
    }

    // Validate Drive Date (only allow today or upcoming days)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dParts = driveDate.split('-');
    const dDate = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
    dDate.setHours(0, 0, 0, 0);

    if (isNaN(dDate.getTime()) || dDate < todayStart) {
      UI.toast('Past date and time cannot be selected. Please choose a current or future date and time.', 'error');
      return false;
    }

    // Validate Round Start Date & Time
    const rDateParts = dateVal.split('-');
    const rTimeParts = timeVal.split(':');
    const roundSched = new Date(
      parseInt(rDateParts[0]),
      parseInt(rDateParts[1]) - 1,
      parseInt(rDateParts[2]),
      parseInt(rTimeParts[0]),
      parseInt(rTimeParts[1])
    );
    const now = new Date();

    if (isNaN(roundSched.getTime()) || roundSched < now) {
      UI.toast('Past date and time cannot be selected. Please choose a current or future date and time.', 'error');
      return false;
    }

    // Validate Round End Date & Time (Deadline)
    const endDateVal = document.getElementById('r' + num + '-end-date')?.value;
    const endTimeVal = document.getElementById('r' + num + '-end-time')?.value;

    if (!endDateVal || !endTimeVal) {
      UI.toast(`Please select an End Date & Time (Deadline) for Round ${num}.`, 'error');
      return false;
    }

    const eDateParts = endDateVal.split('-');
    const eTimeParts = endTimeVal.split(':');
    const endSched = new Date(
      parseInt(eDateParts[0]),
      parseInt(eDateParts[1]) - 1,
      parseInt(eDateParts[2]),
      parseInt(eTimeParts[0]),
      parseInt(eTimeParts[1])
    );

    if (isNaN(endSched.getTime())) {
      UI.toast('Past date and time cannot be selected. Please choose a current or future date and time.', 'error');
      return false;
    }

    if (endSched <= roundSched) {
      UI.toast('End time must always be greater than start time.', 'error');
      return false;
    }

    const allDrives = Storage.getHiringDrives();
    let drive = allDrives.find(d => d.title === driveTitle);
    if (!drive) {
      drive = { id: Date.now().toString(), title: driveTitle, date: driveDate, rounds: [] };
    }

    const cfg = { 
      num: num, 
      topics: topics,
      date: dateVal,
      time: timeVal,
      endDate: endDateVal,
      endTime: endTimeVal
    };

    if (num === 1) {
      const durStr = document.getElementById('r1-dur').value.trim();
      const countStr = document.getElementById('r1-count').value.trim();
      const posStr = document.getElementById('r1-pos').value.trim();

      if (durStr === '') { UI.toast('Please enter a value for Duration in Round 1.', 'error'); return false; }
      if (countStr === '') { UI.toast('Please enter a value for Questions in Round 1.', 'error'); return false; }
      if (posStr === '') { UI.toast('Please enter a value for Positive Marks in Round 1.', 'error'); return false; }

      const dur   = parseInt(durStr);
      const count = parseInt(countStr);

      // Positive marks: auto-normalize accidental negatives, enforce 1–100
      let pos = parseFloat(posStr);
      if (pos < 0) pos = Math.abs(pos);

      if (isNaN(dur)   || dur   <= 0) { UI.toast('Duration in Round 1 must be a valid positive number.', 'error'); return false; }
      if (isNaN(count) || count <= 0) { UI.toast('Questions count in Round 1 must be a valid positive number.', 'error'); return false; }
      if (isNaN(pos)   || pos   <  1 || pos > 100) { UI.toast('Positive marks must be between 1 and 100.', 'error'); return false; }

      cfg.duration      = dur;
      cfg.count         = count;
      cfg.positiveMarks = pos;

      cfg.negativeEnabled = document.getElementById('r1-neg-toggle').checked;
      if (cfg.negativeEnabled) {
        const negStr = document.getElementById('r1-neg').value.trim();
        if (negStr === "") { UI.toast('Please enter a value for Negative Marks in Round 1.', 'error'); return false; }
        let neg = parseFloat(negStr);
        // Normalize: if user enters positive number (e.g. 1), convert to negative (-1)
        if (neg > 0) neg = -neg;
        // Strict range: -100 to -1 only (0 is NOT allowed)
        if (isNaN(neg) || neg < -100 || neg > -1) {
          UI.toast('Negative marks must be between -1 and -100 (e.g. -1, -2, … -100).', 'error');
          return false;
        }
        cfg.negativeMarks = neg;
      } else {
        cfg.negativeMarks = 0;
      }
      cfg.camera = false;
      cfg.webcamEnabled = false;
      cfg.shortlistBy = 'score_then_time';
    } else if (num === 2) {
      const durStr = document.getElementById('r2-dur').value.trim();
      if (durStr === "") { UI.toast('Please enter a Duration for Round 2.', 'error'); return false; }
      const dur = parseInt(durStr);
      if (isNaN(dur) || dur <= 0) { UI.toast('Duration in Round 2 must be a valid positive number.', 'error'); return false; }

      // Enforce that questions have been generated AND approved
      if (!_r2ApprovedQuestions || _r2ApprovedQuestions.length === 0) {
        UI.toast('Please generate and approve questions before allocating Round 2.', 'error'); return false;
      }

      if (_r2Source === 'manual') {
        // Manual mode: collect all question blocks
        _syncManualFormToState();
        const mqs = _manualQuestions.filter(q => q.title || q.statement);
        if (mqs.length === 0) {
          UI.toast('Please fill in at least one manual question before allocating.', 'error');
          return false;
        }
        // Enrich manual questions to match the expected structure for the compiler
        const enriched = mqs.map(q => ({
          ...q,
          topic: 'Manual',
          starterCode: {
            javascript: '// Write your code here\n',
            python: '# Write your code here\n',
            java: '// Write your code here\n',
            cpp: '// Write your code here\n',
            c: '// Write your code here\n'
          }
        }));
        cfg.duration = dur;
        cfg.count = enriched.length;
        cfg.camera = false;
        cfg.webcamEnabled = false;
        cfg.shortlistBy = 'code_correctness_then_time';
        cfg.questionType = 'manual';
        cfg.aiGeneratedQuestions = enriched;
      } else {
        // AI mode
        if (!_r2ApprovedQuestions || _r2ApprovedQuestions.length === 0) {
          UI.toast('Please generate and approve AI questions before allocating Round 2.', 'error');
          return false;
        }
        cfg.duration = dur;
        cfg.count = _r2ApprovedQuestions.length;
        cfg.camera = false;
        cfg.webcamEnabled = false;
        cfg.shortlistBy = 'code_correctness_then_time';
        cfg.questionType = 'ai';
        cfg.aiGeneratedQuestions = _r2ApprovedQuestions;
      }
    } else if (num === 3) {
      const durStr = document.getElementById('r3-dur').value.trim();
      const countStr = document.getElementById('r3-count').value.trim();

      if (durStr === "") { UI.toast('Please enter a value for Duration in Round 3.', 'error'); return false; }
      if (countStr === "") { UI.toast('Please enter a value for Questions in Round 3.', 'error'); return false; }

      const dur = parseInt(durStr);
      const count = parseInt(countStr);

      if (isNaN(dur) || dur <= 0) { UI.toast('Duration in Round 3 must be a valid positive number.', 'error'); return false; }
      if (isNaN(count) || count <= 0) { UI.toast('Questions count in Round 3 must be a valid positive number.', 'error'); return false; }

      cfg.duration = dur;
      cfg.count = count;
      cfg.camera = true;
      cfg.webcamEnabled = true;
      cfg.systemCheck = true;
      cfg.shortlistBy = 'accuracy_explanation_confidence';
    } else if (num === 4) {
      const durStr = document.getElementById('r4-dur').value.trim();
      const countStr = document.getElementById('r4-count').value.trim();

      if (durStr === "") { UI.toast('Please enter a value for Duration in Round 4.', 'error'); return false; }
      if (countStr === "") { UI.toast('Please enter a value for Questions in Round 4.', 'error'); return false; }

      const dur = parseInt(durStr);
      const count = parseInt(countStr);

      if (isNaN(dur) || dur <= 0) { UI.toast('Duration in Round 4 must be a valid positive number.', 'error'); return false; }
      if (isNaN(count) || count <= 0) { UI.toast('Questions count in Round 4 must be a valid positive number.', 'error'); return false; }

      cfg.duration = dur;
      cfg.count = count;
      cfg.camera = true;
      cfg.webcamEnabled = true;
      cfg.systemCheck = true;
      cfg.shortlistBy = 'clarity_fluency_confidence';
    } else if (num === 5) {
      const durStr = document.getElementById('r5-dur').value.trim();
      const countStr = document.getElementById('r5-count').value.trim();

      if (durStr === "") { UI.toast('Please enter a value for Duration in Round 5.', 'error'); return false; }
      if (countStr === "") { UI.toast('Please enter a value for Questions in Round 5.', 'error'); return false; }

      const dur = parseInt(durStr);
      const count = parseInt(countStr);

      if (isNaN(dur) || dur <= 0) { UI.toast('Duration in Round 5 must be a valid positive number.', 'error'); return false; }
      if (isNaN(count) || count <= 0) { UI.toast('Questions count in Round 5 must be a valid positive number.', 'error'); return false; }

      cfg.duration = dur;
      cfg.count = count;
      cfg.camera = true;
      cfg.webcamEnabled = true;
      cfg.systemCheck = true;
      cfg.resumeRequired = true;
      cfg.shortlistBy = 'leadership_cultural_fit_confidence';
    }

    drive.rounds[num - 1] = cfg;
    Storage.saveHiringDrive(drive);
    UI.toast('Round ' + num + ' successfully allocated and scheduled.', 'success');
    return true;
  }

  function allocateAll() {
    for (let i = 1; i <= 5; i++) {
      const success = allocateRound(i);
      if (!success) {
        return;
      }
    }
    UI.toast('All 5 rounds successfully allocated and scheduled!', 'success');
  }

  return { renderAll, toggleTopic, allocateRound, allocateAll, toggleR2Topic, switchR2Source, onR2CountChange, onR2CustomCountInput, onR2DiffChange, generateR2Questions, approveR2Questions, addManualQuestion, deleteManualQuestion, onManualCountChange, onManualCountCustomInput, _onManualInput };
})();
