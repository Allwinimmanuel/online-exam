/* ============================================
   Analytics — Canvas Charts & Performance
   ============================================ */
const Analytics = (() => {
  const COLORS = {
    primary: '#6366f1', accent: '#a855f7', success: '#22c55e',
    warning: '#eab308', danger: '#ef4444', info: '#0ea5e9',
    grid: 'rgba(255,255,255,0.06)', text: '#94a3b8', textLight: '#64748b',
    chartColors: ['#6366f1','#a855f7','#22c55e','#0ea5e9','#f97316','#eab308','#ef4444','#ec4899','#14b8a6','#8b5cf6']
  };

  function _setupCanvas(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  }

  function drawRadarChart(canvasId, labels, values, maxVal = 100) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const w = canvas.parentElement.clientWidth || 300;
    const h = Math.min(w, 300);
    const ctx = _setupCanvas(canvas, w, h);
    const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 40;
    const n = labels.length, angleStep = (2 * Math.PI) / n;

    // Grid
    for (let lvl = 1; lvl <= 5; lvl++) {
      const lr = (r * lvl) / 5;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = i * angleStep - Math.PI / 2;
        const x = cx + lr * Math.cos(a), y = cy + lr * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1; ctx.stroke();
    }

    // Axes & Labels
    for (let i = 0; i < n; i++) {
      const a = i * angleStep - Math.PI / 2;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y);
      ctx.strokeStyle = COLORS.grid; ctx.stroke();
      const lx = cx + (r + 20) * Math.cos(a), ly = cy + (r + 20) * Math.sin(a);
      ctx.fillStyle = COLORS.text; ctx.font = '11px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
    }

    // Data
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const a = idx * angleStep - Math.PI / 2;
      const v = Math.min(values[idx] / maxVal, 1) * r;
      const x = cx + v * Math.cos(a), y = cy + v * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.fillStyle = 'rgba(99,102,241,0.2)'; ctx.fill();
    ctx.strokeStyle = COLORS.primary; ctx.lineWidth = 2; ctx.stroke();

    // Points
    for (let i = 0; i < n; i++) {
      const a = i * angleStep - Math.PI / 2;
      const v = Math.min(values[i] / maxVal, 1) * r;
      const x = cx + v * Math.cos(a), y = cy + v * Math.sin(a);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = COLORS.primary; ctx.fill();
      ctx.strokeStyle = '#1a1a24'; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  function drawBarChart(canvasId, labels, values, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const w = canvas.parentElement.clientWidth || 400;
    const h = 220;
    const ctx = _setupCanvas(canvas, w, h);
    const pad = { t: 20, r: 20, b: 40, l: 45 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const maxV = Math.max(...values, 1);
    const barW = Math.min((cw / labels.length) * 0.6, 40);
    const gap = cw / labels.length;

    // Y-axis grid
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + ch - (ch * i) / 5;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y);
      ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = COLORS.textLight; ctx.font = '10px Inter';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round((maxV * i) / 5), pad.l - 8, y);
    }

    // Bars
    labels.forEach((label, i) => {
      const x = pad.l + i * gap + (gap - barW) / 2;
      const bh = (values[i] / maxV) * ch;
      const y = pad.t + ch - bh;
      const color = colors ? colors[i % colors.length] : COLORS.chartColors[i % COLORS.chartColors.length];

      // Bar with gradient
      const grad = ctx.createLinearGradient(x, y, x, pad.t + ch);
      grad.addColorStop(0, color); grad.addColorStop(1, color + '40');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, [4, 4, 0, 0]);
      ctx.fill();

      // Value label
      ctx.fillStyle = COLORS.text; ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center'; ctx.fillText(values[i], x + barW / 2, y - 8);

      // X label
      ctx.fillStyle = COLORS.textLight; ctx.font = '10px Inter';
      ctx.textBaseline = 'top';
      const shortLabel = label.length > 8 ? label.substring(0, 7) + '..' : label;
      ctx.fillText(shortLabel, x + barW / 2, pad.t + ch + 8);
    });
  }

  function drawLineChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const w = canvas.parentElement.clientWidth || 400;
    const h = 200;
    const ctx = _setupCanvas(canvas, w, h);
    const pad = { t: 20, r: 20, b: 35, l: 45 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const maxV = Math.max(...values, 1);
    const step = cw / Math.max(values.length - 1, 1);

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + ch - (ch * i) / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y);
      ctx.strokeStyle = COLORS.grid; ctx.stroke();
      ctx.fillStyle = COLORS.textLight; ctx.font = '10px Inter';
      ctx.textAlign = 'right'; ctx.fillText(Math.round((maxV * i) / 4), pad.l - 8, y);
    }

    // Area fill
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + ch);
    values.forEach((v, i) => {
      const x = pad.l + i * step, y = pad.t + ch - (v / maxV) * ch;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.l + (values.length - 1) * step, pad.t + ch);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
    grad.addColorStop(0, 'rgba(99,102,241,0.3)'); grad.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = pad.l + i * step, y = pad.t + ch - (v / maxV) * ch;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = COLORS.primary; ctx.lineWidth = 2.5; ctx.stroke();

    // Points
    values.forEach((v, i) => {
      const x = pad.l + i * step, y = pad.t + ch - (v / maxV) * ch;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = COLORS.primary; ctx.fill();
      ctx.strokeStyle = '#1a1a24'; ctx.lineWidth = 2; ctx.stroke();
    });

    // X labels
    labels.forEach((l, i) => {
      const x = pad.l + i * step;
      ctx.fillStyle = COLORS.textLight; ctx.font = '10px Inter';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(l, x, pad.t + ch + 8);
    });
  }

  function drawPieChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const w = canvas.parentElement.clientWidth || 280;
    const h = 220;
    const ctx = _setupCanvas(canvas, w, h);
    const cx = w * 0.4, cy = h / 2, r = Math.min(cx, cy) - 20;
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let startAngle = -Math.PI / 2;

    values.forEach((v, i) => {
      const sliceAngle = (v / total) * 2 * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS.chartColors[i % COLORS.chartColors.length]; ctx.fill();
      ctx.strokeStyle = '#1a1a24'; ctx.lineWidth = 2; ctx.stroke();
      startAngle += sliceAngle;
    });

    // Inner circle (donut)
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a24'; ctx.fill();

    // Legend
    const lx = w * 0.7;
    labels.forEach((l, i) => {
      const ly = 30 + i * 22;
      ctx.fillStyle = COLORS.chartColors[i % COLORS.chartColors.length];
      ctx.fillRect(lx, ly, 10, 10);
      ctx.fillStyle = COLORS.text; ctx.font = '11px Inter';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const pct = Math.round((values[i] / total) * 100);
      ctx.fillText(`${l} (${pct}%)`, lx + 16, ly + 5);
    });
  }

  function drawCircularProgress(containerId, value, max = 100, size = 120, color) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const pct = Math.min(value / max, 1);
    const strokeW = 8, r = (size - strokeW) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - pct);
    const c = color || (pct >= 0.7 ? COLORS.success : pct >= 0.4 ? COLORS.warning : COLORS.danger);

    container.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${COLORS.grid}" stroke-width="${strokeW}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${c}" stroke-width="${strokeW}"
          stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
          transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset 1s ease"/>
      </svg>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column">
        <span style="font-size:${size*0.22}px;font-weight:800;color:${c}">${Math.round(value)}</span>
        <span style="font-size:${size*0.1}px;color:#64748b">/ ${max}</span>
      </div>`;
    container.style.position = 'relative';
    container.style.width = size + 'px';
    container.style.height = size + 'px';
  }

  return { drawRadarChart, drawBarChart, drawLineChart, drawPieChart, drawCircularProgress };
})();
