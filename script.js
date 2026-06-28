function fmtDec(v, d = 6) {
  if (!isFinite(v)) return String(v);
  return parseFloat(v.toFixed(d)).toString();
}

// ──  nama variabel (x,y,z atau x1,x2,...) ─────────────
function varName(i, n) {
  if (n <= 3) return ['x', 'y', 'z'][i];
  return `x${i + 1}`;
}

// ── evaluasi f(x) atau f(x,y) ────────────────────────
function evalFn(expr, x, y = 0) {
  // perkalian implisit: 2x → 2*x, 3( → 3*(, x( → x*(
  let e = expr
    .replace(/\^/g, '**')
    .replace(/(\d)(x|y|\()/g, '$1*$2')
    .replace(/(x|y)(\()/g, '$1*$2')
    .replace(/\bln\b/g, 'Math.log')
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\bpi\b/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E');
  try {
    // eslint-disable-next-line no-new-func
    return Function('x', 'y', `"use strict"; return (${e});`)(x, y);
  } catch (err) {
    throw new Error(`Ekspresi tidak valid: ${expr}`);
  }
}

// ── ambil nilai matriks dari input grid ───────────────
function getMatrix(prefix, rows, cols) {
  const M = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      const el = document.getElementById(`${prefix}-m${i}${j}`);
      if (!el) throw new Error(`Input matriks [${i}][${j}] tidak ditemukan`);
      const v = parseFloat(el.value);
      if (isNaN(v)) throw new Error(`Nilai matriks [${i + 1}][${j + 1}] tidak valid`);
      row.push(v);
    }
    M.push(row);
  }
  return M;
}

// ──  render matriks augmented ke HTML tabel ───────────
function matrixToTable(M, n, augmented = false) {
  const cols = M[0].length;
  let h = `<table class="result-table" style="font-size:10px"><tbody>`;
  M.forEach(row => {
    h += '<tr>';
    row.forEach((v, j) => {
      const sep = augmented && j === n - 1 ? 'border-right:2px solid var(--accent);padding-right:10px' : '';
      h += `<td style="text-align:right;${sep}">${fmtDec(v, 4)}</td>`;
    });
    h += '</tr>';
  });
  h += '</tbody></table>';
  return h;
}

// ── UI: tampilkan & sembunyikan panel ─────────────────────────
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => (p.style.display = 'none'));
  const el = document.getElementById(`panel-${id}`);
  if (el) el.style.display = 'block';

  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  document.querySelectorAll(`.menu-item[data-panel="${id}"]`).forEach(m => m.classList.add('active'));

  // Update judul metode di mobile method button
  const titles = {
    welcome: '— Pilih Metode —',
    gj: 'Gauss-Jordan',
    gs: 'Gauss-Seidel',
    inv: 'Invers Matriks',
    rf: 'Regula Falsi',
    nr: 'Newton-Raphson',
    lag: 'Interpolasi Lagrange',
    simp: 'Simpson 1/3',
    eu: 'Metode Euler'
  };
  const btn = document.getElementById('mobile-method-btn');
  if (btn) btn.textContent = '▦ ' + (titles[id] || id);

  // tutup sidebar & sheet di mobile
  closeSidebar();
  closeMobileSheet();
}

function showErr(prefix, msg) {
  const el = document.getElementById(`${prefix}-err`);
  if (el) { el.textContent = '⚠ ' + msg; el.classList.add('show'); }
}
function clearErr(prefix) {
  const el = document.getElementById(`${prefix}-err`);
  if (el) { el.textContent = ''; el.classList.remove('show'); }
}
function showResult(prefix, html) {
  const el = document.getElementById(`${prefix}-result`);
  if (el) { el.innerHTML = html; el.classList.add('show'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}
function clearResult(prefix) {
  const el = document.getElementById(`${prefix}-result`);
  if (el) { el.innerHTML = ''; el.classList.remove('show'); }
}

// ── UI: sidebar & overlay ─────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  if (!document.getElementById('history-panel').classList.contains('open'))
    document.getElementById('overlay').classList.remove('active');
}
function openHistory() {
  document.getElementById('history-panel').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}
function closeHistory() {
  document.getElementById('history-panel').classList.remove('open');
  if (!document.getElementById('sidebar').classList.contains('open'))
    document.getElementById('overlay').classList.remove('active');
}
function openMobileSheet() {
  document.getElementById('mobile-method-sheet').classList.add('open');
}
function closeMobileSheet() {
  document.getElementById('mobile-method-sheet').classList.remove('open');
}

// ── MATRIKS: build grid input ─────────────────────────────────
function buildMatrix(prefix, rows, cols, defaultVal = 0) {
  const container = document.getElementById(`${prefix}-matrix`);
  if (!container) return;
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'matrix-grid';
  grid.style.gridTemplateColumns = `repeat(${cols}, 52px)`;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.id = `${prefix}-m${i}${j}`;
      inp.className = 'matrix-cell';
      inp.value = defaultVal;
      inp.step = 'any';
      inp.addEventListener('focus', e => e.target.select());
      grid.appendChild(inp);
    }
  }
  container.appendChild(grid);
}

function buildGJMatrix() {
  const n = parseInt(document.getElementById('gj-n').value);
  buildMatrix('gj', n, n + 1);
  // default example: 2x+y-z=8, -3x-y+2z=-11, -2x+y+2z=-3
  const ex = [[2,1,-1,8],[-3,-1,2,-11],[-2,1,2,-3]];
  if (n === 3) ex.forEach((row, i) => row.forEach((v, j) => {
    const el = document.getElementById(`gj-m${i}${j}`); if (el) el.value = v;
  }));
}

function buildGSMatrix() {
  const n = parseInt(document.getElementById('gs-n').value);
  buildMatrix('gs', n, n + 1);
  // default: 4x+y+2z=4, 3x+5y+z=7, x+y+3z=3
  const ex = [[4,1,2,4],[3,5,1,7],[1,1,3,3]];
  if (n === 3) ex.forEach((row, i) => row.forEach((v, j) => {
    const el = document.getElementById(`gs-m${i}${j}`); if (el) el.value = v;
  }));
}

function buildInvMatrix() {
  const n = parseInt(document.getElementById('inv-n').value);
  buildMatrix('inv', n, n);
  const ex = [[1,2,3],[0,1,4],[5,6,0]];
  if (n === 3) ex.forEach((row, i) => row.forEach((v, j) => {
    const el = document.getElementById(`inv-m${i}${j}`); if (el) el.value = v;
  }));
}

// ── HISTORI ───────────────────────────────────────────────────
const HIST_KEY = 'numcalc_history';
const HIST_MAX = 50;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; } catch { return []; }
}
function saveHistory(arr) {
  localStorage.setItem(HIST_KEY, JSON.stringify(arr));
}
function addHistory(method, params, resultText) {
  const arr = loadHistory();
  arr.unshift({ id: Date.now(), method, params, resultText, time: new Date().toLocaleString('id-ID') });
  if (arr.length > HIST_MAX) arr.length = HIST_MAX;
  saveHistory(arr);
  renderHistory();
}
function deleteHistoryItem(id) {
  saveHistory(loadHistory().filter(h => h.id !== id));
  renderHistory();
}
function clearHistory() {
  saveHistory([]);
  renderHistory();
}
function renderHistory() {
  const list = document.getElementById('history-list');
  const count = document.getElementById('history-count');
  const arr = loadHistory();
  if (count) count.textContent = arr.length;
  if (!list) return;
  if (arr.length === 0) {
    list.innerHTML = `<div class="history-empty"><span>📋</span>Belum ada perhitungan</div>`;
    return;
  }
  list.innerHTML = arr.map(h => `
    <div class="history-item">
      <div class="history-method">${h.method}</div>
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">${h.params}</div>
      <div class="history-result">${h.resultText}</div>
      <div class="history-time">${h.time}</div>
      <button class="history-del" onclick="deleteHistoryItem(${h.id})" title="Hapus">×</button>
    </div>`).join('');
}

//  METODE 1 — INVERS MATRIKS
function solveInvers() {
  clearErr('inv'); clearResult('inv');
  const n = parseInt(document.getElementById('inv-n').value);
  let A;
  try { A = getMatrix('inv', n, n); } catch (e) { showErr('inv', e.message); return; }
  const M = A.map((row, i) => { const id = new Array(n).fill(0); id[i] = 1; return [...row, ...id]; });
  const stepLog = [{ label: 'Matriks augmented awal [A | I]', matrix: M.map(r => [...r]) }];

  for (let k = 0; k < n; k++) {
    let maxIdx = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[maxIdx][k])) maxIdx = i;
    if (maxIdx !== k) { [M[k], M[maxIdx]] = [M[maxIdx], M[k]]; stepLog.push({ label: `Tukar R${k + 1} ↔ R${maxIdx + 1}`, matrix: M.map(r => [...r]) }); }
    if (Math.abs(M[k][k]) < 1e-12) { showErr('inv', 'Matriks singular — tidak dapat diinvers'); return; }
    const piv = M[k][k];
    if (Math.abs(piv - 1) > 1e-12) {
      for (let j = 0; j < 2 * n; j++) M[k][j] /= piv;
      stepLog.push({ label: `R${k + 1} ÷ ${fmtDec(piv, 4)}`, matrix: M.map(r => [...r]) });
    }
    for (let i = 0; i < n; i++) {
      if (i !== k && Math.abs(M[i][k]) > 1e-15) {
        const f = M[i][k];
        for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j];
        stepLog.push({ label: `R${i + 1} − (${fmtDec(f, 4)}) × R${k + 1}`, matrix: M.map(r => [...r]) });
      }
    }
  }

  const Ainv = M.map(row => row.slice(n));
  let html = `<div class="result-header">// INVERS MATRIKS A⁻¹</div>
  <table class="result-table"><tbody>`;
  for (let i = 0; i < n; i++)
    html += '<tr>' + Ainv[i].map(v => `<td style="text-align:right;color:var(--accent)">${fmtDec(v, 4)}</td>`).join('') + '</tr>';
  html += '</table>';

  html += `<div style="margin-top:18px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PENYELESAIAN — LANGKAH OBE [A | I] → [I | A⁻¹]</div>
  <div style="margin-top:6px;font-size:11px;color:var(--text-dim);line-height:1.8;background:var(--surface3);border-radius:6px;padding:10px;margin-bottom:10px">
  <b style="color:var(--accent3)">Algoritma Invers via Gauss-Jordan:</b><br>
  1. Bentuk matriks augmented [A | I] ukuran n×2n<br>
  2. Terapkan OBE (Gauss-Jordan) pada seluruh matriks augmented<br>
  3. Lakukan partial pivoting, normalisasi pivot, eliminasi semua baris (termasuk atas)<br>
  4. Ketika sisi kiri menjadi [I], sisi kanan menjadi A⁻¹<br>
  5. Verifikasi: A × A⁻¹ = I
  </div>
  <div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">`;
  stepLog.forEach((s, idx) => {
    html += `<div><div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">${idx === 0 ? '' : `Langkah ${idx}: `}${s.label}</div>${matrixToTable(s.matrix, n, true)}</div>`;
  });
  html += `</div>`;
  showResult('inv', html);
  addHistory('Invers Matriks', `n=${n}`, 'Invers berhasil dihitung');
}

//  METODE 3 — GAUSS-SEIDEL
function solveGaussSeidel() {
  clearErr('gs'); clearResult('gs');
  const n = parseInt(document.getElementById('gs-n').value);
  const tol = parseFloat(document.getElementById('gs-tol').value);
  const maxIter = parseInt(document.getElementById('gs-iter').value);
  let M;
  try { M = getMatrix('gs', n, n + 1); } catch (e) { showErr('gs', e.message); return; }

  const A = M.map(r => r.slice(0, n));
  const b = M.map(r => r[n]);
  const names = Array.from({ length: n }, (_, i) => varName(i, n));

  let isDomWarn = false;
  for (let i = 0; i < n; i++) {
    const diag = Math.abs(A[i][i]);
    const rest = A[i].reduce((s, v, j) => j !== i ? s + Math.abs(v) : s, 0);
    if (diag < rest) { isDomWarn = true; break; }
  }

  let x = new Array(n).fill(0);
  const iterRows = [];
  let converged = false;

  for (let iter = 1; iter <= maxIter; iter++) {
    const xOld = [...x];
    for (let i = 0; i < n; i++) {
      let sigma = b[i];
      for (let j = 0; j < n; j++) if (j !== i) sigma -= A[i][j] * x[j];
      if (Math.abs(A[i][i]) < 1e-12) { showErr('gs', `Diagonal A[${i + 1}][${i + 1}] = 0 — tidak bisa dibagi`); return; }
      x[i] = sigma / A[i][i];
    }
    const maxErr = Math.max(...x.map((v, i) => Math.abs(v - xOld[i])));
    iterRows.push({ iter, x: [...x], maxErr });
    if (maxErr < tol) { converged = true; break; }
  }

  let html = `<div class="result-header">// HASIL — GAUSS-SEIDEL</div>`;
  if (isDomWarn) html += `<div style="font-size:11px;color:var(--warn);margin-bottom:8px">⚠ Matriks mungkin tidak diagonally dominant — konvergensi tidak dijamin.</div>`;
  html += x.map((v, i) => `<div class="step-item"><span class="step-num">${names[i]}</span><span style="color:var(--accent)">${fmtDec(v, 6)}</span></div>`).join('');
  html += `<div style="font-size:11px;color:var(--text-dim);margin-top:8px">${iterRows.length} iterasi · ${converged ? '✔ konvergen' : '⚠ berhenti di batas iterasi'}</div>`;

  html += `<div style="margin-top:18px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PENYELESAIAN</div>
  <div style="margin-top:6px;font-size:11px;color:var(--text-dim);line-height:1.8;background:var(--surface3);border-radius:6px;padding:10px;margin-bottom:10px">
  <b style="color:var(--accent3)">Algoritma Gauss-Seidel (iteratif):</b><br>
  1. Mulai dari tebakan awal x₁=x₂=...=xₙ=0<br>
  2. Untuk setiap iterasi, perbarui xᵢ menggunakan rumus:<br>
  &nbsp;&nbsp;&nbsp;<code>xᵢ = (bᵢ − Σⱼ≠ᵢ aᵢⱼ·xⱼ) / aᵢᵢ</code><br>
  3. Nilai xⱼ yang baru langsung dipakai dalam iterasi yang sama (berbeda dari Jacobi)<br>
  4. Hitung max|Δx| = max|xᵢ_baru − xᵢ_lama|<br>
  5. Ulangi sampai max|Δx| < toleransi atau batas iterasi tercapai
  </div>`;

  html += `<div style="font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL ITERASI</div>
  <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr><th>n</th>${names.map(nm => `<th>${nm}</th>`).join('')}<th>max|Δ|</th></tr></thead><tbody>`;
  iterRows.forEach(r => {
    html += `<tr><td>${r.iter}</td>${r.x.map(v => `<td style="color:var(--accent3)">${fmtDec(v, 6)}</td>`).join('')}<td>${fmtDec(r.maxErr, 6)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  showResult('gs', html);
  addHistory('Gauss-Seidel', `n=${n}`, x.map((v, i) => `${names[i]}=${fmtDec(v, 4)}`).join(', '));
}

//  METODE 4 — REGULA FALSI
function solveRegulaFalsi() {
  clearErr('rf'); clearResult('rf');
  const fxStr = document.getElementById('rf-fx').value.trim();
  let a = parseFloat(document.getElementById('rf-a').value);
  let b = parseFloat(document.getElementById('rf-b').value);
  const tol = parseFloat(document.getElementById('rf-tol').value);
  const maxIter = parseInt(document.getElementById('rf-iter').value);

  if (!fxStr) { showErr('rf', 'Masukkan f(x)'); return; }
  if (isNaN(a) || isNaN(b) || isNaN(tol) || isNaN(maxIter)) { showErr('rf', 'Nilai tidak valid'); return; }
  if (a >= b) { showErr('rf', 'a harus < b'); return; }
  let fa, fb;
  try { fa = evalFn(fxStr, a); fb = evalFn(fxStr, b); } catch (e) { showErr('rf', e.message); return; }
  if (fa * fb > 0) { showErr('rf', 'f(a)·f(b) > 0 — interval tidak mengurung akar'); return; }

  const rows = []; let c = a, fc = fa, converged = false, iterUsed = 0;
  for (let i = 1; i <= maxIter; i++) {
    const cPrev = c;
    c = (a * fb - b * fa) / (fb - fa);
    fc = evalFn(fxStr, c);
    const errStep = i === 1 ? null : Math.abs(c - cPrev);
    rows.push({ i, a, b, fa, fb, c, fc, err: errStep }); iterUsed = i;
    if (Math.abs(fc) < tol) { converged = true; break; }
    if (fa * fc < 0) { b = c; fb = fc; } else { a = c; fa = fc; }
  }

  let html = `<div class="result-header">// HASIL — REGULA FALSI</div>
    <div class="result-value">x ≈ ${fmtDec(c, 6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">${iterUsed} iterasi · ${converged ? '✔ konvergen' : '⚠ batas iterasi tercapai'}</div>

    <div style="margin-top:18px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PENYELESAIAN</div>
    <div style="margin-top:6px;font-size:11px;color:var(--text-dim);line-height:1.8;background:var(--surface3);border-radius:6px;padding:10px;margin-bottom:10px">
    <b style="color:var(--accent3)">Algoritma Regula Falsi (False Position):</b><br>
    1. Pilih interval [a, b] sehingga f(a)·f(b) &lt; 0 (tanda berlawanan → ada akar di interval)<br>
    2. Hitung titik potong garis sekanta:<br>
    &nbsp;&nbsp;&nbsp;<code>xᵣ = (a·f(b) − b·f(a)) / (f(b) − f(a))</code><br>
    3. Evaluasi f(xᵣ):<br>
    &nbsp;&nbsp;&nbsp;• Jika |f(xᵣ)| &lt; toleransi → xᵣ adalah akar ✔<br>
    &nbsp;&nbsp;&nbsp;• Jika f(a)·f(xᵣ) &lt; 0 → akar di [a, xᵣ], set b = xᵣ<br>
    &nbsp;&nbsp;&nbsp;• Jika f(b)·f(xᵣ) &lt; 0 → akar di [xᵣ, b], set a = xᵣ<br>
    4. Ulangi dari langkah 2
    </div>

    <div style="font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL ITERASI</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>a</th><th>b</th><th>f(a)</th><th>f(b)</th><th>xᵣ</th><th>f(xᵣ)</th><th>|Δx|</th>
    </tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr><td>${r.i}</td><td>${fmtDec(r.a, 5)}</td><td>${fmtDec(r.b, 5)}</td>
    <td>${fmtDec(r.fa, 5)}</td><td>${fmtDec(r.fb, 5)}</td>
    <td style="color:var(--accent3)">${fmtDec(r.c, 6)}</td>
    <td>${fmtDec(r.fc, 6)}</td>
    <td>${r.err === null ? '—' : fmtDec(r.err, 6)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  showResult('rf', html);
  addHistory('Regula Falsi', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(c, 6)}`);
}

//  METODE 5 — NEWTON-RAPHSON
function solveNewtonRaphson() {
  clearErr('nr'); clearResult('nr');
  const fxStr = document.getElementById('nr-fx').value.trim();
  const dfxStr = document.getElementById('nr-dfx').value.trim();
  let x = parseFloat(document.getElementById('nr-x0').value);
  const tol = parseFloat(document.getElementById('nr-tol').value);
  const maxIter = parseInt(document.getElementById('nr-iter').value);

  if (!fxStr || !dfxStr) { showErr('nr', "Masukkan f(x) dan f'(x)"); return; }
  const rows = []; let converged = false, iterUsed = 0;
  for (let i = 1; i <= maxIter; i++) {
    let fx, dfx;
    try { fx = evalFn(fxStr, x); dfx = evalFn(dfxStr, x); } catch (e) { showErr('nr', e.message); return; }
    if (Math.abs(dfx) < 1e-12) { showErr('nr', `f'(x) ≈ 0 pada iterasi ${i} — coba tebakan awal lain`); return; }
    const xNew = x - fx / dfx;
    const err = Math.abs(xNew - x);
    rows.push({ i, x, fx, dfx, xNew, err }); iterUsed = i; x = xNew;
    if (err < tol) { converged = true; break; }
  }

  let html = `<div class="result-header">// HASIL — NEWTON-RAPHSON</div>
    <div class="result-value">x ≈ ${fmtDec(x, 6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">${iterUsed} iterasi · ${converged ? '✔ konvergen' : '⚠ batas iterasi tercapai'}</div>

    <div style="margin-top:18px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PENYELESAIAN</div>
    <div style="margin-top:6px;font-size:11px;color:var(--text-dim);line-height:1.8;background:var(--surface3);border-radius:6px;padding:10px;margin-bottom:10px">
    <b style="color:var(--accent3)">Algoritma Newton-Raphson:</b><br>
    1. Tentukan tebakan awal x₀<br>
    2. Hitung nilai fungsi f(xₙ) dan turunannya f'(xₙ)<br>
    3. Perbarui nilai x dengan rumus:<br>
    &nbsp;&nbsp;&nbsp;<code>xₙ₊₁ = xₙ − f(xₙ) / f'(xₙ)</code><br>
    4. Hitung |Δx| = |xₙ₊₁ − xₙ|<br>
    5. Jika |Δx| &lt; toleransi → SELESAI, jika tidak → ulangi dari langkah 2<br>
    ⚠ Jika f'(xₙ) ≈ 0 atau tebakan awal jauh dari akar, metode mungkin tidak konvergen
    </div>

    <div style="font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL ITERASI</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>f(xₙ)</th><th>f'(xₙ)</th><th>xₙ₊₁</th><th>|Δx|</th>
    </tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr><td>${r.i}</td><td>${fmtDec(r.x, 6)}</td><td>${fmtDec(r.fx, 6)}</td>
    <td>${fmtDec(r.dfx, 6)}</td>
    <td style="color:var(--accent3)">${fmtDec(r.xNew, 6)}</td>
    <td>${fmtDec(r.err, 6)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  showResult('nr', html);
  addHistory('Newton-Raphson', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(x, 6)}`);
}

//  METODE 6 — INTERPOLASI LAGRANGE
function buildLagrangePoints() {
  const n = parseInt(document.getElementById('lag-n')?.value) || 4;
  const container = document.getElementById('lag-points-container');
  if (!container) return;
  const defaults = [[1,1],[2,4],[3,9],[4,16],[5,25],[6,36],[7,49],[8,64],[9,81],[10,100]];
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  for (let i = 0; i < n; i++) {
    const d = defaults[i] || [i + 1, (i + 1) ** 2];
    html += `<div class="field"><label>x${i + 1}</label><input type="number" id="lag-x${i}" value="${d[0]}" step="any" onfocus="this.select()"></div>
             <div class="field"><label>y${i + 1}</label><input type="number" id="lag-y${i}" value="${d[1]}" step="any" onfocus="this.select()"></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function solveLagrange() {
  clearErr('lag'); clearResult('lag');
  const n = parseInt(document.getElementById('lag-n').value);
  const xt = parseFloat(document.getElementById('lag-xt').value);
  if (isNaN(xt)) { showErr('lag', 'x taksir tidak valid'); return; }
  const xs = [], ys = [];
  for (let i = 0; i < n; i++) {
    const xi = parseFloat(document.getElementById(`lag-x${i}`).value);
    const yi = parseFloat(document.getElementById(`lag-y${i}`).value);
    if (isNaN(xi) || isNaN(yi)) { showErr('lag', `Nilai titik ${i + 1} tidak valid`); return; }
    xs.push(xi); ys.push(yi);
  }

  let Px = 0;
  const stepRows = [];
  for (let i = 0; i < n; i++) {
    let Li = 1; const factors = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        if (Math.abs(xs[i] - xs[j]) < 1e-15) { showErr('lag', 'Nilai x tidak boleh sama'); return; }
        const num = xt - xs[j], den = xs[i] - xs[j], frac = num / den;
        factors.push({ j, num, den, frac }); Li *= frac;
      }
    }
    Px += Li * ys[i]; stepRows.push({ i, xi: xs[i], yi: ys[i], Li, factors });
  }

  let html = `<div class="result-header">// HASIL — INTERPOLASI LAGRANGE</div>
    <div class="result-value">P(${xt}) ≈ ${fmtDec(Px, 6)}</div>

    <div style="margin-top:18px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PENYELESAIAN</div>
    <div style="margin-top:6px;font-size:11px;color:var(--text-dim);line-height:1.8;background:var(--surface3);border-radius:6px;padding:10px;margin-bottom:10px">
    <b style="color:var(--accent3)">Algoritma Interpolasi Lagrange:</b><br>
    1. Berikan n titik data (xᵢ, yᵢ), i = 1..n<br>
    2. Untuk setiap i, hitung basis polinomial Lᵢ(x):<br>
    &nbsp;&nbsp;&nbsp;<code>Lᵢ(x) = ∏ⱼ≠ᵢ (x − xⱼ) / (xᵢ − xⱼ)</code><br>
    3. Hitung polinomial interpolasi:<br>
    &nbsp;&nbsp;&nbsp;<code>P(x) = Σᵢ yᵢ · Lᵢ(x)</code><br>
    4. Evaluasi P(x) pada titik yang diinginkan
    </div>

    <div style="font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL Lᵢ(x)</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ</th><th>yᵢ</th><th>Lᵢ(x)</th><th>yᵢ·Lᵢ(x)</th></tr></thead><tbody>`;
  stepRows.forEach(s => {
    html += `<tr><td>${s.i + 1}</td><td>${fmtDec(s.xi, 4)}</td><td>${fmtDec(s.yi, 4)}</td>
    <td style="color:var(--accent3)">${fmtDec(s.Li, 6)}</td><td>${fmtDec(s.Li * s.yi, 6)}</td></tr>`;
  });
  html += `<tr><td colspan="4" style="font-weight:700">Σ yᵢ·Lᵢ(x)</td><td style="color:var(--accent)"><b>${fmtDec(Px, 6)}</b></td></tr>`;
  html += '</tbody></table></div>';

  // Detail faktor Lᵢ per basis
  html += `<div style="margin-top:12px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// DETAIL FAKTOR Lᵢ(x)</div>`;
  stepRows.forEach(s => {
    const fracStr = s.factors.map(f => `(${fmtDec(xt,3)}−${fmtDec(xs[f.j],3)})/(${fmtDec(s.xi,3)}−${fmtDec(xs[f.j],3)})`).join(' × ');
    html += `<div style="font-size:10px;color:var(--text-dim);margin-top:4px">L${s.i+1}(${xt}) = ${fracStr} = <span style="color:var(--accent3)">${fmtDec(s.Li,6)}</span></div>`;
  });

  showResult('lag', html);
  addHistory('Interpolasi Lagrange', `x=${xt}, n=${n}`, `P(${xt}) ≈ ${fmtDec(Px, 6)}`);
}

//  METODE 7 — SIMPSON 1/3
function solveSimpson() {
  clearErr('simp'); clearResult('simp');
  const fxStr = document.getElementById('simp-fx').value.trim();
  const a = parseFloat(document.getElementById('simp-a').value);
  const b = parseFloat(document.getElementById('simp-b').value);
  let n = parseInt(document.getElementById('simp-n').value);

  if (!fxStr) { showErr('simp', 'Masukkan f(x)'); return; }
  if (isNaN(a) || isNaN(b) || isNaN(n)) { showErr('simp', 'Nilai tidak valid'); return; }
  if (a >= b) { showErr('simp', 'a harus < b'); return; }
  if (n < 2) { showErr('simp', 'n minimal 2'); return; }
  if (n % 2 !== 0) { n++; document.getElementById('simp-n').value = n; }

  const h = (b - a) / n;
  const points = []; let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = a + i * h; let fx;
    try { fx = evalFn(fxStr, x); } catch (e) { showErr('simp', e.message); return; }
    const coef = (i === 0 || i === n) ? 1 : (i % 2 === 0 ? 2 : 4);
    points.push({ i, x, fx, coef }); sum += coef * fx;
  }
  const I = (h / 3) * sum;

  // Estimasi galat (turunan ke-4 numerik)
  let errEst = null;
  try {
    const mid = (a + b) / 2;
    const hd = Math.max(h, 1e-4);
    const f = v => evalFn(fxStr, v);
    const f4mid = (f(mid-2*hd) - 4*f(mid-hd) + 6*f(mid) - 4*f(mid+hd) + f(mid+2*hd)) / Math.pow(hd, 4);
    errEst = Math.abs(((b - a) * Math.pow(h, 4) / 180) * f4mid);
  } catch {}

  let html = `<div class="result-header">// HASIL — SIMPSON 1/3</div>
    <div class="result-value">∫f(x)dx ≈ ${parseFloat(I.toFixed(10))}</div>
    <div style="font-size:11px;color:var(--text-dim)">h = ${fmtDec(h, 6)} &nbsp;·&nbsp; n = ${n}</div>
    ${errEst !== null ? `<div style="font-size:11px;color:var(--text-dim)">Estimasi galat ≈ ${errEst.toExponential(4)}</div>` : ''}

    <div style="margin-top:18px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PENYELESAIAN</div>
    <div style="margin-top:6px;font-size:11px;color:var(--text-dim);line-height:1.8;background:var(--surface3);border-radius:6px;padding:10px;margin-bottom:10px">
    <b style="color:var(--accent3)">Algoritma Simpson 1/3:</b><br>
    1. Bagi interval [a, b] menjadi n sub-interval dengan lebar h = (b−a)/n (n harus genap)<br>
    2. Hitung titik xᵢ = a + i·h untuk i = 0, 1, ..., n<br>
    3. Terapkan koefisien: ujung = 1, ganjil = 4, genap = 2<br>
    &nbsp;&nbsp;&nbsp;<code>Σ = f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + ... + 4f(xₙ₋₁) + f(xₙ)</code><br>
    4. Hitung integral:<br>
    &nbsp;&nbsp;&nbsp;<code>∫f(x)dx ≈ (h/3) × Σ</code><br>
    5. Galat baku: E ≈ −(b−a)·h⁴/180 · f⁴(ξ) untuk suatu ξ ∈ [a,b]
    </div>

    <div style="font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL TITIK</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ</th><th>f(xᵢ)</th><th>Koef.</th><th>Koef.×f(xᵢ)</th></tr></thead><tbody>`;
  points.forEach(p => {
    html += `<tr><td>${p.i}</td><td>${fmtDec(p.x, 5)}</td><td>${fmtDec(p.fx, 8)}</td><td>${p.coef}</td><td>${fmtDec(p.coef * p.fx, 8)}</td></tr>`;
  });
  html += `</tbody></table></div>
    <div style="margin-top:10px;font-size:11px;color:var(--text-dim)">
    Σ = ${fmtDec(sum, 8)} &nbsp;→&nbsp; ∫ ≈ (${fmtDec(h,6)}/3) × ${fmtDec(sum,8)} = <b style="color:var(--accent3)">${parseFloat(I.toFixed(10))}</b>
    </div>`;

  showResult('simp', html);
  addHistory('Simpson 1/3', `[${a},${b}], n=${n}`, `∫ ≈ ${parseFloat(I.toFixed(8))}`);
}

//  METODE 8 — METODE EULER
function solveEuler() {
  clearErr('eu'); clearResult('eu');
  const fxyStr = document.getElementById('eu-fxy').value.trim();
  let x = parseFloat(document.getElementById('eu-x0').value);
  let y = parseFloat(document.getElementById('eu-y0').value);
  const h = parseFloat(document.getElementById('eu-h').value);
  const steps = parseInt(document.getElementById('eu-steps').value);

  if (!fxyStr) { showErr('eu', 'Masukkan f(x,y)'); return; }
  if (isNaN(x) || isNaN(y) || isNaN(h) || isNaN(steps)) { showErr('eu', 'Nilai tidak valid'); return; }
  if (h <= 0) { showErr('eu', 'h harus > 0'); return; }
  if (steps < 1 || steps > 500) { showErr('eu', 'Langkah harus 1–500'); return; }

  const rows = [{ i: 0, x, y, fxy: null }];
  for (let i = 1; i <= steps; i++) {
    let fxy;
    try { fxy = evalFn(fxyStr, x, y); } catch (e) { showErr('eu', e.message); return; }
    const yNew = y + h * fxy, xNew = +(x + h).toFixed(10);
    rows.push({ i, x: xNew, y: yNew, fxy, xPrev: x, yPrev: y }); x = xNew; y = yNew;
  }

  let html = `<div class="result-header">// HASIL — METODE EULER</div>
    <div class="result-value">y(${fmtDec(x, 4)}) ≈ ${fmtDec(y, 6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">h = ${fmtDec(h, 4)} &nbsp;·&nbsp; ${steps} langkah</div>

    <div style="margin-top:18px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// CARA PENYELESAIAN</div>
    <div style="margin-top:6px;font-size:11px;color:var(--text-dim);line-height:1.8;background:var(--surface3);border-radius:6px;padding:10px;margin-bottom:10px">
    <b style="color:var(--accent3)">Algoritma Metode Euler:</b><br>
    1. Berikan kondisi awal: x₀, y₀ = y(x₀), step size h, dan jumlah langkah<br>
    2. Untuk setiap langkah n = 0, 1, 2, ...:<br>
    &nbsp;&nbsp;&nbsp;a. Hitung f(xₙ, yₙ) = dy/dx pada titik saat ini<br>
    &nbsp;&nbsp;&nbsp;b. Perbarui nilai y dengan skema Euler orde-1:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code>yₙ₊₁ = yₙ + h · f(xₙ, yₙ)</code><br>
    &nbsp;&nbsp;&nbsp;c. Perbarui x: xₙ₊₁ = xₙ + h<br>
    3. Ulangi sampai semua langkah selesai<br>
    ⚠ Galat global O(h) — semakin kecil h, semakin akurat hasilnya
    </div>

    <div style="font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL LANGKAH</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>yₙ</th><th>f(xₙ,yₙ)</th><th>yₙ₊₁</th></tr></thead><tbody>`;
  rows.forEach(r => {
    if (r.i === 0) html += `<tr><td>0</td><td>${fmtDec(r.x, 5)}</td><td>${fmtDec(r.y, 6)}</td><td>—</td><td style="color:var(--text-faint)">(nilai awal)</td></tr>`;
    else html += `<tr><td>${r.i}</td><td>${fmtDec(r.xPrev, 5)}</td><td>${fmtDec(r.yPrev, 6)}</td><td>${fmtDec(r.fxy, 6)}</td><td style="color:var(--accent3)">${fmtDec(r.y, 6)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  showResult('eu', html);
  addHistory('Metode Euler', `y'=${fxyStr.substring(0, 30)}`, `y(${fmtDec(x, 4)}) ≈ ${fmtDec(y, 6)}`);
}

document.addEventListener('DOMContentLoaded', () => {

  // ── Inisialisasi matriks & titik data ───────────────────────
  buildGSMatrix();
  buildInvMatrix();
  buildLagrangePoints();

  // ── Navigasi sidebar & overlay ──────────────────────────────
  document.getElementById('mobile-menu-btn')?.addEventListener('click', openSidebar);
  document.getElementById('mobile-history-btn')?.addEventListener('click', openHistory);
  document.getElementById('close-sidebar')?.addEventListener('click', closeSidebar);
  document.getElementById('close-history')?.addEventListener('click', closeHistory);
  document.getElementById('overlay')?.addEventListener('click', () => {
    closeSidebar(); closeHistory(); closeMobileSheet();
  });

  // ── Mobile bottom sheet ─────────────────────────────────────
  document.getElementById('mobile-method-btn')?.addEventListener('click', openMobileSheet);
  document.getElementById('close-method-sheet')?.addEventListener('click', closeMobileSheet);

  // ── Menu sidebar (semua .menu-item[data-panel]) ─────────────
  document.querySelectorAll('.menu-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => showPanel(item.dataset.panel));
  });

  // ── Tombol "Buat Matriks / Buat Titik Data" ─────────────────
  document.getElementById('gs-build-btn')?.addEventListener('click', buildGSMatrix);
  document.getElementById('inv-build-btn')?.addEventListener('click', buildInvMatrix);
  document.getElementById('lag-build-btn')?.addEventListener('click', buildLagrangePoints);

  // ── Tombol HITUNG (solve) ────────────────────────────────────
  document.getElementById('gs-solve-btn')?.addEventListener('click', solveGaussSeidel);
  document.getElementById('inv-solve-btn')?.addEventListener('click', solveInvers);
  document.getElementById('rf-solve-btn')?.addEventListener('click', solveRegulaFalsi);
  document.getElementById('nr-solve-btn')?.addEventListener('click', solveNewtonRaphson);
  document.getElementById('lag-solve-btn')?.addEventListener('click', solveLagrange);
  document.getElementById('simp-solve-btn')?.addEventListener('click', solveSimpson);
  document.getElementById('eu-solve-btn')?.addEventListener('click', solveEuler);

  // ── Tombol Reset ─────────────────────────────────────────────
  document.getElementById('gs-reset-btn')?.addEventListener('click', () => {
    buildGSMatrix(); clearResult('gs'); clearErr('gs');
  });
  document.getElementById('inv-reset-btn')?.addEventListener('click', () => {
    buildInvMatrix(); clearResult('inv'); clearErr('inv');
  });
  document.getElementById('rf-reset-btn')?.addEventListener('click', () => {
    clearResult('rf'); clearErr('rf');
  });
  document.getElementById('nr-reset-btn')?.addEventListener('click', () => {
    clearResult('nr'); clearErr('nr');
  });
  document.getElementById('lag-reset-btn')?.addEventListener('click', () => {
    buildLagrangePoints(); clearResult('lag'); clearErr('lag');
  });
  document.getElementById('simp-reset-btn')?.addEventListener('click', () => {
    clearResult('simp'); clearErr('simp');
  });
  document.getElementById('eu-reset-btn')?.addEventListener('click', () => {
    clearResult('eu'); clearErr('eu');
  });

  // ── Tombol Hapus Semua Histori ───────────────────────────────
  document.getElementById('clear-history-btn')?.addEventListener('click', () => {
    if (confirm('Hapus semua histori?')) clearHistory();
  });

  // ── Auto-select value saat input number difokus ──────────────
  document.addEventListener('focusin', e => {
    if (e.target.type === 'number') e.target.select();
  });

  // ── Render histori & tampilkan welcome ───────────────────────
  renderHistory();
  showPanel('welcome');
});
