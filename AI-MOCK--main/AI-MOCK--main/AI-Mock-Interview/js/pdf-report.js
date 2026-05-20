/* ============================================
   PDF Report Generator
   ============================================ */
const PDFReport = (() => {
  function generate(sessionData) {
    const { totalScore, grade, questionsAnswered, strengths, weaknesses,
      communicationScore, avgResponseTime, questionResults, topMissedKeywords } = sessionData.analysis;
    const { domain, difficulty, duration, timestamp, violations, candidateName, regNumber } = sessionData;

    const win = window.open('', '_blank');
    if (!win) { alert('Please allow popups to download the report.'); return; }

    const gradeColor = grade.startsWith('A') ? '#22c55e' : grade === 'B' ? '#0ea5e9' : grade === 'C' ? '#eab308' : '#ef4444';
    const date = new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const diffLabel = difficulty === 1 ? 'Fresher' : difficulty === 2 ? 'Intermediate' : 'Expert';

    let questionsHTML = '';
    if (questionResults) {
      questionResults.forEach((qr, i) => {
        const scoreColor = qr.evaluation.score >= 70 ? '#22c55e' : qr.evaluation.score >= 45 ? '#eab308' : '#ef4444';
        const borderColor = qr.evaluation.score >= 70 ? '#22c55e' : qr.evaluation.score >= 45 ? '#eab308' : '#ef4444';
        questionsHTML += `
          <div style="margin-bottom:16px;padding:16px;border:1px solid #e2e8f0;border-left:4px solid ${borderColor};border-radius:8px;background:#fafafa">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="color:#1e293b">Q${i + 1}: ${qr.question.q}</strong>
              <span style="background:${scoreColor}20;color:${scoreColor};padding:2px 10px;border-radius:20px;font-weight:700;font-size:13px">${qr.evaluation.score}/100</span>
            </div>
            <p style="color:#475569;font-size:13px;margin:6px 0"><strong>Your Answer:</strong> ${qr.answer || '<em>No answer</em>'}</p>
            <p style="color:#64748b;font-size:12px;margin:6px 0;padding:8px;background:#f1f5f9;border-radius:4px"><strong>Ideal Answer:</strong> ${qr.question.a}</p>
            <p style="color:#6366f1;font-size:12px;margin:4px 0"><strong>Keywords Found:</strong> ${qr.evaluation.keywordsFound.join(', ') || 'None'}</p>
            <p style="color:#ef4444;font-size:12px;margin:4px 0"><strong>Keywords Missed:</strong> ${qr.evaluation.keywordsMissed.join(', ') || 'None'}</p>
            <p style="color:#475569;font-size:12px;margin:4px 0"><em>${qr.evaluation.feedback}</em></p>
          </div>`;
      });
    }

    let violationsHTML = '';
    if (violations && violations.length > 0) {
      violationsHTML = `<div style="margin-top:30px;padding:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px">
        <h3 style="color:#dc2626;margin-bottom:12px">Security Violations (${violations.length})</h3>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr style="background:#fee2e2"><th style="padding:6px;text-align:left">Type</th><th style="padding:6px;text-align:left">Time</th><th style="padding:6px;text-align:left">Severity</th></tr>
          ${violations.map(v => `<tr style="border-bottom:1px solid #fecaca"><td style="padding:6px">${v.type}</td><td style="padding:6px">${new Date(v.timestamp).toLocaleTimeString()}</td><td style="padding:6px;color:${v.severity==='critical'?'#dc2626':'#ca8a04'}">${v.severity}</td></tr>`).join('')}
        </table></div>`;
    }

    const html = `<!DOCTYPE html><html><head><title>Mock Interview Report - ${domain}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;padding:40px;max-width:800px;margin:0 auto;background:white}
      @media print{body{padding:20px}button{display:none!important}}
      .header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #6366f1}
      .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
      .metric{padding:16px;background:#f8fafc;border-radius:10px;text-align:center;border:1px solid #e2e8f0}
      .metric-val{font-size:24px;font-weight:800;color:#6366f1}
      .metric-label{font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase}
      .section{margin:24px 0}.section h3{font-size:16px;margin-bottom:12px;color:#334155;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
      .tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px}
      .tag-green{background:#dcfce7;color:#166534}.tag-red{background:#fee2e2;color:#991b1b}.tag-blue{background:#dbeafe;color:#1e40af}
    </style></head><body>
    <button onclick="window.print()" style="position:fixed;top:20px;right:20px;padding:10px 20px;background:#6366f1;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.15)">Print / Save PDF</button>
    <div class="header">
      <h1 style="font-size:28px;color:#6366f1">Mock Interview Report</h1>
      <h2 style="font-size:18px;color:#1e293b;margin-top:10px">${candidateName} (${regNumber})</h2>
      <p style="color:#64748b;margin-top:6px">${date}</p>
      <div style="margin-top:16px">
        <span style="display:inline-block;width:80px;height:80px;line-height:80px;border-radius:50%;background:${gradeColor}15;border:3px solid ${gradeColor};color:${gradeColor};font-size:32px;font-weight:900">${grade}</span>
      </div>
      <p style="font-size:36px;font-weight:800;color:#1e293b;margin-top:10px">${totalScore}<span style="font-size:18px;color:#94a3b8"> / 100</span></p>
    </div>
    <div class="metrics">
      <div class="metric"><div class="metric-val">${questionsAnswered}</div><div class="metric-label">Questions</div></div>
      <div class="metric"><div class="metric-val">${domain}</div><div class="metric-label">Domain</div></div>
      <div class="metric"><div class="metric-val">${diffLabel}</div><div class="metric-label">Difficulty</div></div>
      <div class="metric"><div class="metric-val">${communicationScore}%</div><div class="metric-label">Communication</div></div>
    </div>
    <div class="section"><h3>Strengths</h3>${strengths.map(s => `<span class="tag tag-green">✓ ${s}</span>`).join(' ')}</div>
    <div class="section"><h3>Areas for Improvement</h3>${weaknesses.map(w => `<span class="tag tag-red">△ ${w}</span>`).join(' ')}</div>
    ${topMissedKeywords.length > 0 ? `<div class="section"><h3>Key Topics to Review</h3>${topMissedKeywords.map(k => `<span class="tag tag-blue">${k}</span>`).join(' ')}</div>` : ''}
    <div class="section"><h3>Question-by-Question Analysis</h3>${questionsHTML}</div>
    ${violationsHTML}
    <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">
      <p>Generated by AI Mock Interview System • ${date}</p>
      <p>This is an automated assessment. Use results as practice guidance.</p>
    </div></body></html>`;

    win.document.write(html);
    win.document.close();
  }

  return { generate };
})();
