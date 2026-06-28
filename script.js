let history = JSON.parse(localStorage.getItem('numcalc-history') || '[]');

function saveHistory() {
  localStorage.setItem('numcalc-history', JSON.stringify(history));
}

function addHistory(method, params, resultText) {
  const item = {
    id: Date.now(),
    method,
    params,
    resultText: resultText.substring(0, 100),
    time: new Date().toLocaleString('id-ID')
  };
  history.unshift(item);
  if (history.length > 50) history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('history-list');
  const count = document.getElementById('hist-count');
  if (!list) return;
  count.textContent = history.length;
  if (!history.length) {
    list.innerHTML = '<div class="history-empty"><span>🕒</span>Belum ada perhitungan</div>';
    return;
  }
  list.innerHTML = history.map(h => `
    <div class="history-item">
      <button class="history-del" onclick="deleteHistory(${h.id})">×</button>
      <div class="history-method">${h.method}</div>
      <div class="history-result">${h.resultText}</div>
      <div class="history-time">${h.time}</div>
    </div>
  `).join('');
}

function deleteHistory(id) {
  history = history.filter(h => h.id !== id);
  saveHistory();
  renderHistory();
}

function clearHistory() {
  if (confirm('Hapus semua histori?')) {
    history = [];
    saveHistory();
    renderHistory();
  }
}

// UTILITIES
function showErr(id, msg) {
  const el = document.getElementById(id + '-err');
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
  }
}
function clearErr(id) {
  const el = document.getElementById(id + '-err');
  if (el) { el.textContent = ''; el.classList.remove('show'); }
}
function showResult(id, html) {
  const el = document.getElementById(id + '-result');
  if (el) {
    el.innerHTML = html;
    el.classList.add('show');
  }
}
function clearResult(id) {
  const el = document.getElementById(id + '-result');
  if (el) { el.innerHTML = ''; el.classList.remove('show'); }
  clearErr(id);
}
function parseMathExpr(expr) {
  let s = expr.trim();
  if (!s) throw new Error('Ekspresi kosong');

  // Ganti notasi pangkat ^ menjadi ** (operator pangkat JS)
  s = s.replace(/\^/g, '**');

  const FN = 'sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|sqrt|abs|exp|log10|log2|log|ln|pow|min|max|floor|ceil|round|sign|cbrt';

  // 1) angka diikuti langsung variabel/fungsi/kurung buka => sisipkan *
  s = s.replace(new RegExp(`(\\d)\\s*(?=(${FN})\\b)`, 'g'), '$1*');
  s = s.replace(/(\d)\s*(?=[a-zA-Z(])/g, '$1*');

  // 2) kurung tutup diikuti angka/variabel/kurung buka => sisipkan *
  s = s.replace(/\)\s*(?=[\w(])/g, ')*');

  // 3) variabel x atau y diikuti langsung kurung buka => sisipkan *
  s = s.replace(/(?<![a-zA-Z])([xy])\(/g, '$1*(');

  // 4) "ln(" -> "log(" karena Math.log = ln secara matematis
  s = s.replace(/\bln\s*\(/g, 'log(');

  // 5) konstanta umum
  s = s.replace(/\bpi\b/gi, 'PI');
  s = s.replace(/\be\b(?!\d)/g, 'E');

  return s;
}

function evalFn(expr, x, y) {
  let parsed;
  try {
    parsed = parseMathExpr(expr);
  } catch (e) {
    throw new Error('Ekspresi tidak valid: ' + expr);
  }
  try {
    const fn = new Function('x', 'y', 'Math',
      `with(Math){ return (${parsed}); }`);
    const result = fn(x, y, Math);
    if (typeof result !== 'number' || isNaN(result)) {
      throw new Error('Hasil bukan angka — periksa kembali ekspresi f(x)');
    }
    return result;
  } catch (e) {
    throw new Error('Ekspresi tidak valid: "' + expr + '" — ' + (e.message || ''));
  }
}
function fmt(n, d = 6) {
  if (typeof n !== 'number' || isNaN(n)) return n;
  // Selalu tampilkan sebagai desimal (bukan notasi ilmiah 1e-7 dst)
  if (Math.abs(n) < 1e-9) n = 0;
  let out = n.toFixed(d);
  // buang trailing zero berlebih tapi minimal 1 angka desimal jika ada koma
  if (out.includes('.')) out = out.replace(/0+$/, '').replace(/\.$/, '.0');
  return out;
}
function fmtDec(n, d = 6) {
  // Versi yang selalu mengembalikan string desimal tetap (untuk tabel iterasi)
  if (typeof n !== 'number' || isNaN(n)) return '—';
  if (Math.abs(n) < 1e-9) n = 0;
  return n.toFixed(d);
}

// PANEL NAVIGATION
let currentPanel = null;

function selectMethod(methodId) {
  // panggil panel
  showPanel(methodId);

  // tutup sheet jika terbuka
  const sheet = document.getElementById('mobileMethodSheet');
  if (sheet) sheet.classList.remove('open');

  // matikan overlay (agar tidak mengganggu klik berikutnya)
  closeMobileSidebar();
  closeMobileHistory();
}

function showPanel(id) {

  console.log('showPanel dipanggil dengan id:', id);

  // Sembunyikan welcome screen
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'none';

  // Sembunyikan semua panel
  document.querySelectorAll('.panel').forEach(p => {
    p.style.display = 'none';
  });

  // Tampilkan panel yang dipilih
  const panel = document.getElementById('panel-' + id);
  if (panel) {
    panel.style.display = 'contents';
    console.log('Panel ditampilkan:', 'panel-' + id);
  } else {
    console.log('Panel tidak ditemukan:', 'panel-' + id);
  }

  // Update active class pada menu
  document.querySelectorAll('.menu-item').forEach(m => {
    m.classList.remove('active');
    const methodId = m.getAttribute('data-method');
    if (methodId === id) {
      m.classList.add('active');
    }
  });

  currentPanel = id;

  // Initialize matrix jika diperlukan
  if (id === 'gauss-jordan') buildMatrix('gj');
  if (id === 'invers') buildMatrix('inv');
  if (id === 'lagrange') buildLagrangePoints();

  // Tutup sidebar di mobile setelah pilih menu
  closeMobileSidebar();
}

// Fungsi untuk menutup sidebar mobile
function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// Fungsi untuk membuka sidebar mobile
function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('active');
}

// Fungsi untuk menutup history panel mobile
function closeMobileHistory() {
  const historyPanel = document.getElementById('historyPanel');
  const overlay = document.getElementById('mobileOverlay');
  if (historyPanel) historyPanel.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// Fungsi untuk membuka history panel mobile
function openMobileHistory() {
  const historyPanel = document.getElementById('historyPanel');
  const overlay = document.getElementById('mobileOverlay');
  if (historyPanel) historyPanel.classList.add('open');
  if (overlay) overlay.classList.add('active');
}

// MATRIX BUILDER
function buildMatrix(prefix) {
  const nInput = document.getElementById(prefix + '-n');
  if (!nInput) return;
  const n = parseInt(nInput.value) || 3;
  const isInv = prefix === 'inv';
  const cols = isInv ? n : n + 1;
  const container = document.getElementById(prefix + '-matrix');
  if (!container) return;

  container.style.gridTemplateColumns = `repeat(${cols}, minmax(45px, 60px))`;
  let html = '';

  // Header kolom
  for (let j = 0; j < cols; j++) {
    const label = isInv ? `a<sub>${j + 1}</sub>` : (j < n ? `a<sub>${j + 1}</sub>` : 'b');
    html += `<div style="text-align:center;font-size:9px;color:var(--text-faint);padding:2px">${label}</div>`;
  }

  // Isi matriks
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < cols; j++) {
      const val = (i === j && j < n) ? 1 : 0;
      html += `<input type="number" class="matrix-cell" id="${prefix}-${i}-${j}" value="${val}" step="any">`;
    }
  }
  container.innerHTML = html;
}

function getMatrix(prefix, rows, cols) {
  const M = [];
  for (let i = 0; i < rows; i++) {
    M.push([]);
    for (let j = 0; j < cols; j++) {
      const el = document.getElementById(`${prefix}-${i}-${j}`);
      if (!el) throw new Error(`Elemen matriks [${i + 1}][${j + 1}] tidak ditemukan`);
      const v = parseFloat(el.value);
      if (isNaN(v)) throw new Error(`Nilai matriks [${i + 1}][${j + 1}] tidak valid`);
      M[i].push(v);
    }
  }
  return M;
}

// Helper: nama variabel — pakai x, y, z untuk n<=3, fallback x1,x2,... untuk n>3
function varName(i, n) {
  if (n <= 3) return ['x', 'y', 'z'][i];
  return 'x' + (i + 1);
}

// Helper: render satu baris matriks augmented sebagai string rapi
function rowToStr(row, n) {
  return '[ ' + row.map(v => fmtDec(v, 4)).join('  ') + ' ]';
}

// Helper: render seluruh matriks sebagai tabel HTML kecil
function matrixToTable(M, n, isAugmented) {
  let html = '<table class="result-table"><tbody>';
  for (let i = 0; i < M.length; i++) {
    html += '<tr>';
    for (let j = 0; j < M[i].length; j++) {
      const isB = isAugmented && j === n;
      html += `<td style="${isB ? 'border-left:2px solid var(--accent);color:var(--accent3)' : ''}">${fmtDec(M[i][j], 3)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

// GAUSS-JORDAN
function solveGaussJordan() {
  clearErr('gj'); clearResult('gj');
  const nInput = document.getElementById('gj-n');
  if (!nInput) return;
  const n = parseInt(nInput.value);
  let M;
  try { M = getMatrix('gj', n, n + 1); }
  catch (e) { showErr('gj', e.message); return; }

  const A = M.map(row => [...row]);
  const names = Array.from({ length: n }, (_, i) => varName(i, n));
  const stepLog = [];
  stepLog.push({ label: 'Matriks augmented awal [A | b]', matrix: A.map(r => [...r]) });

  for (let k = 0; k < n; k++) {
    let maxIdx = k;
    for (let i = k + 1; i < n; i++)
      if (Math.abs(A[i][k]) > Math.abs(A[maxIdx][k])) maxIdx = i;
    if (maxIdx !== k) {
      [A[k], A[maxIdx]] = [A[maxIdx], A[k]];
      stepLog.push({ label: `Tukar baris R${k + 1} ↔ R${maxIdx + 1} (partial pivoting)`, matrix: A.map(r => [...r]) });
    }
    if (Math.abs(A[k][k]) < 1e-12) { showErr('gj', 'Matriks singular — tidak ada solusi unik'); return; }

    const piv = A[k][k];
    if (Math.abs(piv - 1) > 1e-12) {
      for (let j = 0; j <= n; j++) A[k][j] /= piv;
      stepLog.push({ label: `Normalisasi pivot: R${k + 1} → R${k + 1} ÷ (${fmtDec(piv, 4)})`, matrix: A.map(r => [...r]) });
    }
    for (let i = 0; i < n; i++) {
      if (i !== k && Math.abs(A[i][k]) > 1e-15) {
        const f = A[i][k];
        for (let j = 0; j <= n; j++) A[i][j] -= f * A[k][j];
        stepLog.push({ label: `R${i + 1} → R${i + 1} − (${fmtDec(f, 4)}) × R${k + 1}`, matrix: A.map(r => [...r]) });
      }
    }
  }

  const x = A.map(row => row[n]);

  let html = `<div class="result-header">// HASIL — GAUSS-JORDAN (RREF)</div>`;
  html += x.map((v, i) => `<div class="step-item"><span class="step-num">${names[i]}</span><span>= ${fmtDec(v, 6)}</span></div>`).join('');

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PERHITUNGAN — OPERASI BARIS ELEMENTER</div>`;
  html += '<div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">';
  stepLog.forEach((s, idx) => {
    html += `<div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">${idx === 0 ? '' : `Langkah ${idx}: `}${s.label}</div>
      ${matrixToTable(s.matrix, n, true)}
    </div>`;
  });
  html += '</div>';

  showResult('gj', html);
  addHistory('Gauss-Jordan', `n=${n}`, x.map((v, i) => `${names[i]}=${fmtDec(v, 4)}`).join(', '));
}

// INVERS MATRIKS
function solveInvers() {
  clearErr('inv'); clearResult('inv');
  const nInput = document.getElementById('inv-n');
  if (!nInput) return;
  const n = parseInt(nInput.value);
  let A;
  try { A = getMatrix('inv', n, n); }
  catch (e) { showErr('inv', e.message); return; }

  const M = A.map((row, i) => {
    const id = new Array(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });

  const stepLog = [{ label: 'Matriks augmented awal [A | I]', matrix: M.map(r => [...r]) }];

  for (let k = 0; k < n; k++) {
    let maxIdx = k;
    for (let i = k + 1; i < n; i++)
      if (Math.abs(M[i][k]) > Math.abs(M[maxIdx][k])) maxIdx = i;
    if (maxIdx !== k) {
      [M[k], M[maxIdx]] = [M[maxIdx], M[k]];
      stepLog.push({ label: `Tukar baris R${k + 1} ↔ R${maxIdx + 1} (partial pivoting)`, matrix: M.map(r => [...r]) });
    }
    if (Math.abs(M[k][k]) < 1e-12) { showErr('inv', 'Matriks singular — tidak dapat diinvers'); return; }

    const piv = M[k][k];
    if (Math.abs(piv - 1) > 1e-12) {
      for (let j = 0; j < 2 * n; j++) M[k][j] /= piv;
      stepLog.push({ label: `Normalisasi pivot: R${k + 1} → R${k + 1} ÷ (${fmtDec(piv, 4)})`, matrix: M.map(r => [...r]) });
    }
    for (let i = 0; i < n; i++) {
      if (i !== k && Math.abs(M[i][k]) > 1e-15) {
        const f = M[i][k];
        for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j];
        stepLog.push({ label: `R${i + 1} → R${i + 1} − (${fmtDec(f, 4)}) × R${k + 1}`, matrix: M.map(r => [...r]) });
      }
    }
  }

  const Ainv = M.map(row => row.slice(n));
  let html = `<div class="result-header">// INVERS MATRIKS A⁻¹</div>`;
  html += '<table class="result-table"><tbody>';
  for (let i = 0; i < n; i++) {
    html += '<tr>' + Ainv[i].map(v => `<td style="text-align:right">${fmtDec(v, 4)}</td>`).join('') + '</tr>';
  }
  html += '</table>';

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PERHITUNGAN — OPERASI BARIS ELEMENTER [A | I] → [I | A⁻¹]</div>`;
  html += '<div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">';
  stepLog.forEach((s, idx) => {
    html += `<div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">${idx === 0 ? '' : `Langkah ${idx}: `}${s.label}</div>
      ${matrixToTable(s.matrix, n, true)}
    </div>`;
  });
  html += '</div>';

  showResult('inv', html);
  addHistory('Invers Matriks', `n=${n}`, 'Invers berhasil dihitung');
}

// REGULA FALSI
function solveRegulaFalsi() {
  clearErr('rf'); clearResult('rf');
  const fxStr = document.getElementById('rf-fx').value.trim();
  let a = parseFloat(document.getElementById('rf-a').value);
  let b = parseFloat(document.getElementById('rf-b').value);
  const tol = parseFloat(document.getElementById('rf-tol').value);
  const maxIter = parseInt(document.getElementById('rf-iter').value);

  if (!fxStr) { showErr('rf', 'Masukkan ekspresi f(x)'); return; }
  if (isNaN(a) || isNaN(b) || isNaN(tol) || isNaN(maxIter)) { showErr('rf', 'Nilai tidak valid'); return; }
  if (a >= b) { showErr('rf', 'Batas kiri (a) harus lebih kecil dari batas kanan (b)'); return; }

  let fa, fb;
  try { fa = evalFn(fxStr, a); fb = evalFn(fxStr, b); }
  catch (e) { showErr('rf', e.message); return; }

  if (fa === 0) { showErr('rf', `f(a) = 0 — a = ${fmtDec(a, 6)} sudah merupakan akar eksak`); return; }
  if (fb === 0) { showErr('rf', `f(b) = 0 — b = ${fmtDec(b, 6)} sudah merupakan akar eksak`); return; }
  if (fa * fb > 0) { showErr('rf', `f(a)·f(b) = ${fmtDec(fa * fb, 4)} > 0 — interval tidak mengurung akar. Coba ubah a/b.`); return; }

  const rows = [];
  let c = a, fc = fa, converged = false;
  let iterUsed = 0;

  for (let i = 1; i <= maxIter; i++) {
    const cPrev = c;
    c = (a * fb - b * fa) / (fb - fa);
    fc = evalFn(fxStr, c);
    const errStep = i === 1 ? null : Math.abs(c - cPrev);

    rows.push({ i, a, b, fa, fb, c, fc, err: errStep });
    iterUsed = i;

    if (Math.abs(fc) < tol) { converged = true; break; }

    if (fa * fc < 0) {
      b = c; fb = fc;
    } else {
      a = c; fa = fc;
    }
  }

  let html = `<div class="result-header">// HASIL — REGULA FALSI</div>
    <div class="result-value">x ≈ ${fmtDec(c, 6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">f(x) = ${fmtDec(fc, 6)} · ${iterUsed} iterasi · ${converged ? 'konvergen (|f(x)| < toleransi)' : 'berhenti di batas iterasi maksimum'}</div>`;

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PERHITUNGAN — TABEL ITERASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>a</th><th>b</th><th>f(a)</th><th>f(b)</th><th>x = xᵣ</th><th>f(x)</th><th>|Δx|</th>
  </tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr>
      <td>${r.i}</td>
      <td>${fmtDec(r.a, 6)}</td>
      <td>${fmtDec(r.b, 6)}</td>
      <td>${fmtDec(r.fa, 6)}</td>
      <td>${fmtDec(r.fb, 6)}</td>
      <td style="color:var(--accent3)">${fmtDec(r.c, 6)}</td>
      <td>${fmtDec(r.fc, 6)}</td>
      <td>${r.err === null ? '—' : fmtDec(r.err, 6)}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  showResult('rf', html);
  addHistory('Regula Falsi', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(c, 6)}`);
}

// NEWTON-RAPHSON
function solveNewtonRaphson() {
  clearErr('nr'); clearResult('nr');
  const fxStr = document.getElementById('nr-fx').value.trim();
  const dfxStr = document.getElementById('nr-dfx').value.trim();
  let x = parseFloat(document.getElementById('nr-x0').value);
  const tol = parseFloat(document.getElementById('nr-tol').value);
  const maxIter = parseInt(document.getElementById('nr-iter').value);

  if (!fxStr || !dfxStr) { showErr('nr', 'Masukkan f(x) dan f\'(x)'); return; }
  if (isNaN(x) || isNaN(tol) || isNaN(maxIter)) { showErr('nr', 'Nilai tidak valid'); return; }

  const rows = [];
  let fx, dfx, xNew = x, converged = false, iterUsed = 0;

  for (let i = 1; i <= maxIter; i++) {
    try { fx = evalFn(fxStr, x); dfx = evalFn(dfxStr, x); }
    catch (e) { showErr('nr', e.message); return; }

    if (Math.abs(dfx) < 1e-12) { showErr('nr', `f'(x) ≈ 0 pada iterasi ${i} (x = ${fmtDec(x, 6)}) — Newton-Raphson gagal konvergen, coba tebakan awal lain`); return; }

    xNew = x - fx / dfx;
    const err = Math.abs(xNew - x);
    rows.push({ i, x, fx, dfx, xNew, err });
    iterUsed = i;

    x = xNew;
    if (err < tol) { converged = true; break; }
  }

  let html = `<div class="result-header">// HASIL — NEWTON-RAPHSON</div>
    <div class="result-value">x ≈ ${fmtDec(x, 6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">${iterUsed} iterasi · ${converged ? 'konvergen (|xₙ₊₁ − xₙ| < toleransi)' : 'berhenti di batas iterasi maksimum'}</div>`;

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PERHITUNGAN — TABEL ITERASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>f(xₙ)</th><th>f'(xₙ)</th><th>xₙ₊₁ = xₙ − f/f'</th><th>|Δx|</th>
  </tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr>
      <td>${r.i}</td>
      <td>${fmtDec(r.x, 6)}</td>
      <td>${fmtDec(r.fx, 6)}</td>
      <td>${fmtDec(r.dfx, 6)}</td>
      <td style="color:var(--accent3)">${fmtDec(r.xNew, 6)}</td>
      <td>${fmtDec(r.err, 6)}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  showResult('nr', html);
  addHistory('Newton-Raphson', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(x, 6)}`);
}

// LAGRANGE
function buildLagrangePoints() {
  const nInput = document.getElementById('lag-n');
  if (!nInput) return;
  const n = parseInt(nInput.value) || 4;
  const container = document.getElementById('lag-points-container');
  if (!container) return;

  const defaults = [[1, 1], [2, 4], [3, 9], [4, 16], [5, 25], [6, 36], [7, 49], [8, 64], [9, 81], [10, 100]];
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  for (let i = 0; i < n; i++) {
    const d = defaults[i] || [i + 1, (i + 1) * (i + 1)];
    html += `<div class="field"><label>x${i + 1}</label>
             <input type="number" id="lag-x${i}" value="${d[0]}" step="any"></div>
             <div class="field"><label>y${i + 1}</label>
             <input type="number" id="lag-y${i}" value="${d[1]}" step="any"></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function solveLagrange() {
  clearErr('lag'); clearResult('lag');
  const nInput = document.getElementById('lag-n');
  if (!nInput) return;
  const n = parseInt(nInput.value);
  const xt = parseFloat(document.getElementById('lag-xt').value);
  if (isNaN(xt)) { showErr('lag', 'x taksir tidak valid'); return; }

  const xs = [], ys = [];
  for (let i = 0; i < n; i++) {
    const xi = parseFloat(document.getElementById(`lag-x${i}`).value);
    const yi = parseFloat(document.getElementById(`lag-y${i}`).value);
    if (isNaN(xi) || isNaN(yi)) { showErr('lag', `Nilai titik ${i + 1} tidak valid`); return; }
    xs.push(xi); ys.push(yi);
  }

  // --- LANGKAH PENYELESAIAN (ditambah tabel langkah + kesimpulan tabel) ---
  // P(x) = Σ y_i * L_i(x), dimana L_i(x) = Π_{j≠i} (x - x_j)/(x_i - x_j)
  let Px = 0;

  const stepRows = []; // simpan tiap i dan faktor-faktornya
  const LiValues = [];

  for (let i = 0; i < n; i++) {
    let Li = 1;
    const factors = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        if (Math.abs(xs[i] - xs[j]) < 1e-15) { showErr('lag', 'Nilai x tidak boleh sama'); return; }
        const num = (xt - xs[j]);
        const den = (xs[i] - xs[j]);
        const frac = num / den;
        factors.push({ j, num, den, frac });
        Li *= frac;
      }
    }
    LiValues.push(Li);
    Px += Li * ys[i];

    stepRows.push({
      i,
      xi: xs[i],
      yi: ys[i],
      Li,
      factors
    });
  }

  // Kesimpulan untuk tabel akhir: kontribusi tiap komponen
  const conclusionRows = stepRows.map(s => ({
    i: s.i + 1,
    xi: s.xi,
    yi: s.yi,
    Li: s.Li,
    contrib: s.Li * s.yi
  }));

  let html = `<div class="result-header">// HASIL — INTERPOLASI LAGRANGE</div>
    <div class="result-value">P(${xt}) ≈ ${fmtDec(Px, 6)}</div>`;

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// LANGKAH PENYELESAIAN — TABEL PERHITUNGAN Lᵢ(x)</div>`;
  html += `<div style="overflow-x:auto;margin-top:8px">
    <table class="result-table">
      <thead>
        <tr>
          <th>i</th>
          <th>xᵢ</th>
          <th>yᵢ</th>
          <th>Lᵢ(x)</th>
          <th>Kontribusi yᵢ·Lᵢ(x)</th>
        </tr>
      </thead>
      <tbody>`;

  stepRows.forEach(s => {
    const contrib = s.Li * s.yi;
    html += `<tr>
      <td>${s.i + 1}</td>
      <td>${fmtDec(s.xi, 6)}</td>
      <td>${fmtDec(s.yi, 6)}</td>
      <td style="color:var(--accent3)">${fmtDec(s.Li, 6)}</td>
      <td>${fmtDec(contrib, 6)}</td>
    </tr>`;
  });

  html += `
      </tbody>
    </table>
  </div>`;

  // Tambahan: detail faktor (opsional, tapi membantu “langkah penyelesaian” lebih jelas)
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// RINCIAN FAKTOR (PRODUK Π_{j≠i})</div>`;
  html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:12px">`;
  stepRows.forEach(s => {
    html += `<div>
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:6px">Langkah ${s.i + 1}: Hitung L_${s.i + 1}(x) = Π_{j≠i} (x − xⱼ)/(xᵢ − xⱼ)</div>
      <div style="font-size:11px;color:var(--text-dim);line-height:1.7;">
        ${s.factors.map(f => {
      const left = `(x − x${f.j + 1}) = (${fmtDec(xt, 4)} − ${fmtDec(f.num + xs[f.j], 4)})`;
      return `
            <div style="margin:3px 0">&bull; (${fmtDec(f.num, 4)} / ${fmtDec(f.den, 4)}) = <b style="color:var(--accent3)">${fmtDec(f.frac, 6)}</b></div>`;
    }).join('')}
        <div style="margin-top:6px">⇒ L_${s.i + 1}(x) = <b style="color:var(--accent3)">${fmtDec(s.Li, 6)}</b></div>
      </div>
    </div>`;
  });
  html += `</div>`;

  // (2) Kesimpulan di akhir langkah penyelesaian yang jawabannya table
  html += `<div style="margin-top:18px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// KESIMPULAN (TABEL)</div>`;
  html += `<div style="overflow-x:auto;margin-top:8px">
    <table class="result-table">
      <thead>
        <tr>
          <th>Komponen</th>
          <th>i</th>
          <th>yᵢ</th>
          <th>Lᵢ(x)</th>
          <th>yᵢ·Lᵢ(x)</th>
        </tr>
      </thead>
      <tbody>`;

  conclusionRows.forEach((r, idx) => {
    html += `<tr>
      <td>${idx + 1}</td>
      <td>${r.i}</td>
      <td>${fmtDec(r.yi, 6)}</td>
      <td style="color:var(--accent3)">${fmtDec(r.Li, 6)}</td>
      <td>${fmtDec(r.contrib, 6)}</td>
    </tr>`;
  });

  html += `<tr>
      <td colspan="4" style="font-weight:700;">Jumlah Σ yᵢ·Lᵢ(x)</td>
      <td style="color:var(--accent)"><b>${fmtDec(Px, 6)}</b></td>
    </tr>`;

  html += `</tbody></table></div>`;

  showResult('lag', html);
  addHistory('Interpolasi Lagrange', `x=${xt}, n=${n}`, `P(${xt}) ≈ ${fmtDec(Px, 6)}`);
}

// SIMPSON 1/3
function solveSimpson() {
  clearErr('simp'); clearResult('simp');
  const fxStr = document.getElementById('simp-fx').value.trim();
  const a = parseFloat(document.getElementById('simp-a').value);
  const b = parseFloat(document.getElementById('simp-b').value);
  let n = parseInt(document.getElementById('simp-n').value);

  if (!fxStr) { showErr('simp', 'Masukkan ekspresi f(x)'); return; }
  if (isNaN(a) || isNaN(b) || isNaN(n)) { showErr('simp', 'Nilai tidak valid'); return; }
  if (a >= b) { showErr('simp', 'Batas bawah (a) harus lebih kecil dari batas atas (b)'); return; }
  if (n < 2) { showErr('simp', 'n minimal 2'); return; }
  if (n % 2 !== 0) { n++; document.getElementById('simp-n').value = n; }

  const h = (b - a) / n;
  const points = [];
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = a + i * h;
    let fx;
    try { fx = evalFn(fxStr, x); }
    catch (e) { showErr('simp', e.message); return; }
    let coef;
    if (i === 0 || i === n) coef = 1;
    else if (i % 2 === 0) coef = 2;
    else coef = 4;
    points.push({ i, x, fx, coef });
    sum += coef * fx;
  }
  const I = (h / 3) * sum;

  // Estimasi galat: E ≈ -(b-a)/180 * h^4 * f⁽⁴⁾(ξ), f⁽⁴⁾ didekati
  // secara numerik (central finite difference, order h^2) di titik tengah interval.
  let errEstText = 'tidak dapat dihitung (turunan ke-4 numerik tidak stabil untuk f(x) ini)';
  try {
    const mid = (a + b) / 2;
    const hd = Math.max(h, 1e-3); // step untuk diferensiasi numerik
    const f2 = (xx) => evalFn(fxStr, xx);
    const f4mid = (f2(mid - 2 * hd) - 4 * f2(mid - hd) + 6 * f2(mid) - 4 * f2(mid + hd) + f2(mid + 2 * hd)) / Math.pow(hd, 4);
    const errEst = -((b - a) * Math.pow(h, 4) / 180) * f4mid;
    if (isFinite(errEst)) {
      errEstText = `${fmtDec(errEst, 8)}  (E ≈ −(b−a)h⁴f⁽⁴⁾(ξ)/180, f⁽⁴⁾(ξ) didekati secara numerik di titik tengah)`;
    }
  } catch (e) { /* biarkan pesan default */ }

  let html = `<div class="result-header">// HASIL — SIMPSON 1/3</div>
    <div class="result-value">∫f(x)dx ≈ ${fmtDec(I, 6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">h = ${fmtDec(h, 6)} · n = ${n} subinterval</div>`;

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PERHITUNGAN — TABEL TITIK</div>`;
  html += `<div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ = a + i·h</th><th>f(xᵢ)</th><th>Koefisien</th><th>Koef. × f(xᵢ)</th>
  </tr></thead><tbody>`;
  points.forEach(p => {
    html += `<tr>
      <td>${p.i}</td>
      <td>${fmtDec(p.x, 6)}</td>
      <td>${fmtDec(p.fx, 6)}</td>
      <td>${p.coef}${p.i === 0 || p.i === n ? ' (ujung)' : (p.i % 2 !== 0 ? ' (ganjil)' : ' (genap)')}</td>
      <td>${fmtDec(p.coef * p.fx, 6)}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  html += `<div style="margin-top:12px;font-size:11px;color:var(--text-dim);line-height:1.8">
    Σ(koef × f(xᵢ)) = ${fmtDec(sum, 6)}<br>
    ∫f(x)dx ≈ (h/3) × Σ = (${fmtDec(h, 6)}/3) × ${fmtDec(sum, 6)} = <b style="color:var(--accent3)">${fmtDec(I, 6)}</b>
  </div>`;

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// ESTIMASI GALAT</div>
    <div style="margin-top:6px;font-size:11px;color:var(--text-dim);line-height:1.8">${errEstText}</div>`;

  showResult('simp', html);
  addHistory('Simpson 1/3', `[${a},${b}], n=${n}`, `∫ ≈ ${fmtDec(I, 6)}`);
}

// METODE EULER
function solveEuler() {
  clearErr('eu'); clearResult('eu');
  const fxyStr = document.getElementById('eu-fxy').value.trim();
  let x = parseFloat(document.getElementById('eu-x0').value);
  let y = parseFloat(document.getElementById('eu-y0').value);
  const h = parseFloat(document.getElementById('eu-h').value);
  const steps = parseInt(document.getElementById('eu-steps').value);

  if (!fxyStr) { showErr('eu', 'Masukkan ekspresi f(x,y)'); return; }
  if (isNaN(x) || isNaN(y) || isNaN(h) || isNaN(steps)) { showErr('eu', 'Nilai tidak valid'); return; }
  if (steps < 1) { showErr('eu', 'Jumlah langkah minimal 1'); return; }

  const rows = [{ i: 0, x, y, fxy: null }];
  for (let i = 1; i <= steps; i++) {
    let fxy;
    try { fxy = evalFn(fxyStr, x, y); }
    catch (e) { showErr('eu', e.message); return; }
    const yNew = y + h * fxy;
    const xNew = x + h;
    rows.push({ i, x: xNew, y: yNew, fxy, xPrev: x, yPrev: y });
    x = xNew; y = yNew;
  }

  let html = `<div class="result-header">// HASIL — METODE EULER</div>
    <div class="result-value">y(${fmtDec(x, 4)}) ≈ ${fmtDec(y, 6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">h = ${fmtDec(h, 4)} · ${steps} langkah</div>`;

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PERHITUNGAN — TABEL LANGKAH</div>`;
  html += `<div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>yₙ</th><th>f(xₙ,yₙ)</th><th>yₙ₊₁ = yₙ + h·f</th>
  </tr></thead><tbody>`;
  rows.forEach(r => {
    if (r.i === 0) {
      html += `<tr><td>0</td><td>${fmtDec(r.x, 6)}</td><td>${fmtDec(r.y, 6)}</td><td>—</td><td>(nilai awal)</td></tr>`;
    } else {
      html += `<tr>
        <td>${r.i}</td>
        <td>${fmtDec(r.xPrev, 6)}</td>
        <td>${fmtDec(r.yPrev, 6)}</td>
        <td>${fmtDec(r.fxy, 6)}</td>
        <td style="color:var(--accent3)">${fmtDec(r.y, 6)}</td>
      </tr>`;
    }
  });
  html += `</tbody></table></div>`;

  showResult('eu', html);
  addHistory('Metode Euler', `y'=${fxyStr.substring(0, 30)}`, `y(${fmtDec(x, 4)}) ≈ ${fmtDec(y, 6)}`);
}

// INISIALISASI MOBILE & EVENT
function initMobile() {
  console.log('Init mobile dipanggil');

  // Tombol menu mobile
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileMethodBtn = document.getElementById('mobileMethodBtn');
  const closeMethodSheetBtn = document.getElementById('closeMethodSheet');
  const methodSheet = document.getElementById('mobileMethodSheet');

  const historyBtn = document.getElementById('mobileHistoryBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const closeHistoryBtn = document.getElementById('closeHistory');
  const overlay = document.getElementById('mobileOverlay');

  if (menuBtn) {
    // Hindari clone pada tombol (lebih stabil di HP)
    menuBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openMobileSidebar();
    });
    menuBtn.addEventListener('pointerup', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openMobileSidebar();
    });
  }

  // MOBILE: open/close sheet metode (hit-area besar dan stabil)
  if (mobileMethodBtn && methodSheet) {
    const openSheet = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      methodSheet.classList.add('open');
    };
    mobileMethodBtn.addEventListener('click', openSheet);
    mobileMethodBtn.addEventListener('pointerdown', openSheet);
    mobileMethodBtn.addEventListener('touchstart', openSheet, { passive: false });
  }

  if (closeMethodSheetBtn) {
    const closeSheet = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const sheet = document.getElementById('mobileMethodSheet');
      if (sheet) sheet.classList.remove('open');
    };
    closeMethodSheetBtn.addEventListener('click', closeSheet);
    closeMethodSheetBtn.addEventListener('pointerdown', closeSheet);
    closeMethodSheetBtn.addEventListener('touchstart', closeSheet, { passive: false });
  }

  if (methodSheet) {
    // klik item metode via delegasi
    const onChoice = (e) => {
      const btn = e.target.closest('.method-choice');
      if (!btn) return;
      const methodId = btn.getAttribute('data-method');
      if (!methodId) return;
      e.preventDefault();
      e.stopPropagation();
      selectMethod(methodId);
    };
    methodSheet.addEventListener('pointerdown', onChoice);
    methodSheet.addEventListener('touchstart', onChoice, { passive: false });
    methodSheet.addEventListener('click', onChoice);
  }


  if (historyBtn) {
    historyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openMobileHistory();
    });
    historyBtn.addEventListener('pointerup', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openMobileHistory();
    });
  }


  if (closeSidebarBtn) {
    // Hindari clone pada tombol (lebih stabil di HP)
    closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    closeSidebarBtn.addEventListener('pointerup', closeMobileSidebar);
  }

  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', closeMobileHistory);
    closeHistoryBtn.addEventListener('pointerup', closeMobileHistory);
  }


  if (overlay) {
    overlay.addEventListener('click', function () {
      closeMobileSidebar();
      closeMobileHistory();
    });
    overlay.addEventListener('pointerup', function () {
      closeMobileSidebar();
      closeMobileHistory();
    });
  }

  // BIND MENU ITEMS (event delegation) - paling stabil di HP
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const activateMethod = (methodId) => {
      showPanel(methodId);
    };

    const onActivate = (() => {
      let lastMethodId = null;
      let lastAt = 0;
      const GUARD_MS = 450;

      return (e) => {
        const item = e.target.closest('.menu-item');
        if (!item) return;
        const methodId = item.getAttribute('data-method');
        if (!methodId) return;

        const now = Date.now();
        if (methodId === lastMethodId && (now - lastAt) < GUARD_MS) return;
        lastMethodId = methodId;
        lastAt = now;

        e.preventDefault();
        e.stopPropagation();
        activateMethod(methodId);
      };
    })();


    // Gunakan pointerdown supaya event tidak “hilang” di beberapa device.
    sidebar.addEventListener('pointerdown', onActivate);

    // fallback untuk browser tanpa pointer events
    sidebar.addEventListener('touchstart', onActivate, { passive: false });
    sidebar.addEventListener('click', onActivate);
  }



}

// INITIALIZE semua saat halaman加载
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM Content Loaded');

  // Build semua matrix awal
  buildMatrix('gj');
  buildMatrix('inv');
  buildLagrangePoints();

  // Render history
  renderHistory();

  // Inisialisasi mobile
  initMobile();

  // Auto-select isi input angka saat difokus, agar user bisa langsung
  // mengetik tanpa perlu menghapus nilai default (mis. "0") terlebih dahulu.
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.tagName === 'INPUT' &&
      (e.target.type === 'number' || e.target.type === 'text')) {
      e.target.select();
    }
  });

  // Tampilkan welcome screen
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'flex';
});

// Pastikan semua fungsi global tersedia
window.showPanel = showPanel;
window.solveGaussJordan = solveGaussJordan;
window.solveInvers = solveInvers;
window.solveRegulaFalsi = solveRegulaFalsi;
window.solveNewtonRaphson = solveNewtonRaphson;
window.solveLagrange = solveLagrange;
window.solveSimpson = solveSimpson;
window.solveEuler = solveEuler;
window.buildMatrix = buildMatrix;
window.buildLagrangePoints = buildLagrangePoints;
window.clearResult = clearResult;
window.deleteHistory = deleteHistory;
window.clearHistory = clearHistory;
window.selectMethod = selectMethod;
