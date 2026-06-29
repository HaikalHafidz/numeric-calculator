let history = JSON.parse(localStorage.getItem('numcalc-history') || '[]');

function saveHistory() {
  localStorage.setItem('numcalc-history', JSON.stringify(history));
}

function addHistory(method, params, resultText) {
  const item = {
    id: Date.now(),
    method,
    params,
    resultText: resultText.substring(0, 120),
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

/* =====================================================================
   UTILITAS
   ===================================================================== */
function showErr(id, msg) {
  const el = document.getElementById(id + '-err');
  if (el) { el.textContent = msg; el.classList.add('show'); }
}
function clearErr(id) {
  const el = document.getElementById(id + '-err');
  if (el) { el.textContent = ''; el.classList.remove('show'); }
}
function showResult(id, html) {
  const el = document.getElementById(id + '-result');
  if (el) { el.innerHTML = html; el.classList.add('show'); }
}
function clearResult(id) {
  const el = document.getElementById(id + '-result');
  if (el) { el.innerHTML = ''; el.classList.remove('show'); }
  clearErr(id);
}

/**
 * Mengubah ekspresi matematika alami menjadi ekspresi JS yang valid.
 */
function parseMathExpr(expr) {
  let s = expr.trim();
  if (!s) throw new Error('Ekspresi kosong');

  // ^ → **
  s = s.replace(/\^/g, '**');

  const FN = 'sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|sqrt|abs|exp|log10|log2|log|ln|pow|min|max|floor|ceil|round|sign|cbrt';

  // angka diikuti fungsi/variabel/kurung
  s = s.replace(new RegExp(`(\\d)\\s*(?=(${FN})\\b)`, 'g'), '$1*');
  s = s.replace(/(\d)\s*(?=[a-zA-Z(])/g, '$1*');

  // kurung tutup diikuti sesuatu
  s = s.replace(/\)\s*(?=[\w(])/g, ')*');

  // variabel x/y diikuti kurung
  s = s.replace(/(?<![a-zA-Z])([xy])\(/g, '$1*(');

  // ln( → log(
  s = s.replace(/\bln\s*\(/g, 'log(');

  // konstanta
  s = s.replace(/\bpi\b/gi, 'PI');
  s = s.replace(/\be\b(?!\d)/g, 'E');

  return s;
}

function evalFn(expr, x, y = 0) {
  let parsed;
  try { parsed = parseMathExpr(expr); }
  catch (e) { throw new Error('Ekspresi tidak valid: ' + expr); }
  try {
    const fn = new Function('x', 'y', 'Math', `with(Math){ return (${parsed}); }`);
    const result = fn(x, y, Math);
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Hasil tidak terdefinisi pada x=' + x);
    }
    return result;
  } catch (e) {
    throw new Error('Ekspresi tidak valid: "' + expr + '" — ' + (e.message || ''));
  }
}

/** Format angka desimal, hilangkan trailing zeros berlebih */
function fmt(n, d = 6) {
  if (typeof n !== 'number' || isNaN(n)) return String(n);
  if (Math.abs(n) < 1e-10) n = 0;
  let out = n.toFixed(d);
  if (out.includes('.')) out = out.replace(/0+$/, '').replace(/\.$/, '.0');
  return out;
}

/** Format desimal tetap (untuk tabel iterasi) */
function fmtDec(n, d = 6) {
  if (typeof n !== 'number' || isNaN(n)) return '—';
  if (Math.abs(n) < 1e-10) n = 0;
  return n.toFixed(d);
}

/* NAVIGASI PANEL */
let currentPanel = null;

function showPanel(id) {
  // Sembunyikan welcome
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'none';

  // Sembunyikan semua panel
  document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');

  // Tampilkan panel terpilih
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.style.display = 'contents';

  // Update active class pada nav-link
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('data-method') === id) a.classList.add('active');
  });

  currentPanel = id;

  // Init komponen jika dibutuhkan
  if (id === 'gauss-jordan') buildGJMatrix();
  if (id === 'invers') buildMatrix('inv');
  if (id === 'lagrange') buildLagrangePoints();

  // Tutup menu dropdown setelah pilih
  closeNav();
}

function closeNav() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('nav-open');
}

function openNav() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.add('nav-open');
}

function closeMobileHistory() {
  document.getElementById('historyPanel')?.classList.remove('open');
  document.getElementById('mobileOverlay')?.classList.remove('active');
}

function openMobileHistory() {
  document.getElementById('historyPanel')?.classList.add('open');
  document.getElementById('mobileOverlay')?.classList.add('active');
}

/* MATRIX INVERS  */
function buildMatrix(prefix) {
  const nInput = document.getElementById(prefix + '-n');
  if (!nInput) return;
  const n = parseInt(nInput.value) || 3;
  const container = document.getElementById(prefix + '-matrix');
  if (!container) return;

  container.style.gridTemplateColumns = `repeat(${n}, minmax(48px, 60px))`;
  let html = '';

  // Header kolom
  for (let j = 0; j < n; j++) {
    html += `<div class="matrix-header-cell">a<sub>${j + 1}</sub></div>`;
  }
  // Sel input
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const val = (i === j) ? 1 : 0;
      html += `<input type="number" class="matrix-cell" id="${prefix}-${i}-${j}" value="${val}" step="any">`;
    }
  }
  container.innerHTML = html;
}

/* MATRIX GAUSS-JORDAN */
function buildGJMatrix() {
  const nInput = document.getElementById('gj-n');
  if (!nInput) return;
  const n = parseInt(nInput.value) || 3;

  // --- Matriks A (koefisien) ---
  const containerA = document.getElementById('gj-matrix-A');
  if (containerA) {
    containerA.style.gridTemplateColumns = `repeat(${n}, minmax(54px, 64px))`;
    let html = '';
    // Header: x1, x2, ... xn
    for (let j = 0; j < n; j++) {
      html += `<div class="matrix-header-cell">x<sub>${j + 1}</sub></div>`;
    }
    // Isi: identitas awal (bisa diganti user)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const val = (i === j) ? 1 : 0;
        html += `<input type="number" class="matrix-cell" id="gj-a-${i}-${j}" value="${val}" step="any">`;
      }
    }
    containerA.innerHTML = html;
  }

  // --- Vektor b (konstanta) ---
  const containerB = document.getElementById('gj-matrix-b');
  if (containerB) {
    containerB.style.gridTemplateColumns = `minmax(54px, 64px)`;
    let html = '<div class="matrix-header-cell">b</div>';
    for (let i = 0; i < n; i++) {
      html += `<input type="number" class="matrix-cell" id="gj-b-${i}" value="0" step="any">`;
    }
    containerB.innerHTML = html;
  }
}

/** Ambil nilai matriks dari DOM */
function getMatrixFull(prefix, rows, cols) {
  const M = [];
  for (let i = 0; i < rows; i++) {
    M.push([]);
    for (let j = 0; j < cols; j++) {
      const el = document.getElementById(`${prefix}-${i}-${j}`);
      if (!el) throw new Error(`Sel matriks [${i + 1}][${j + 1}] tidak ditemukan`);
      const v = parseFloat(el.value);
      if (isNaN(v)) throw new Error(`Nilai [${i + 1}][${j + 1}] tidak valid`);
      M[i].push(v);
    }
  }
  return M;
}

/** Helper: nama variabel */
function varName(i, n) {
  if (n <= 3) return ['x', 'y', 'z'][i];
  return 'x' + (i + 1);
}

/** Helper: render matriks augmented sebagai tabel HTML */
function matrixToTable(M, n, isAugmented) {
  let html = '<table class="result-table" style="margin:4px 0"><tbody>';
  for (let i = 0; i < M.length; i++) {
    html += '<tr>';
    for (let j = 0; j < M[i].length; j++) {
      const isB = isAugmented && j === n;
      html += `<td style="${isB ? 'border-left:2px solid var(--border);color:var(--accent3);' : ''}text-align:right;min-width:52px">${fmtDec(M[i][j], 4)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

/* 1. GAUSS-JORDAN */
function solveGaussJordan() {
  clearErr('gj'); clearResult('gj');
  const nInput = document.getElementById('gj-n');
  if (!nInput) { showErr('gj', 'Input tidak ditemukan'); return; }
  const n = parseInt(nInput.value);
  if (isNaN(n) || n < 2 || n > 6) { showErr('gj', 'Ukuran n harus antara 2–6'); return; }

  // Ambil matriks A dari input terpisah
  let A_coef, b_vec;
  try {
    A_coef = getMatrixFull('gj-a', n, n);
  } catch (e) { showErr('gj', 'Matriks A: ' + e.message); return; }

  // Ambil vektor b
  b_vec = [];
  for (let i = 0; i < n; i++) {
    const el = document.getElementById(`gj-b-${i}`);
    if (!el) { showErr('gj', `Nilai b[${i + 1}] tidak ditemukan`); return; }
    const v = parseFloat(el.value);
    if (isNaN(v)) { showErr('gj', `Nilai b[${i + 1}] tidak valid`); return; }
    b_vec.push(v);
  }

  // Bangun matriks augmented [A | b]
  const M = A_coef.map((row, i) => [...row, b_vec[i]]);

  const names = Array.from({ length: n }, (_, i) => 'x' + (i + 1));
  const stepLog = [];
  stepLog.push({ label: 'Matriks augmented awal [A | b]', matrix: M.map(r => [...r]) });

  // Eliminasi Gauss-Jordan dengan partial pivoting
  for (let k = 0; k < n; k++) {
    // Cari pivot terbesar di kolom k
    let maxIdx = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > Math.abs(M[maxIdx][k])) maxIdx = i;
    }
    if (maxIdx !== k) {
      [M[k], M[maxIdx]] = [M[maxIdx], M[k]];
      stepLog.push({
        label: `Tukar baris R${k + 1} ↔ R${maxIdx + 1} (partial pivoting)`,
        matrix: M.map(r => [...r])
      });
    }
    if (Math.abs(M[k][k]) < 1e-12) {
      showErr('gj', 'Matriks singular atau tidak memiliki solusi unik. Periksa kembali nilai koefisien.');
      return;
    }

    // Normalisasi baris pivot: bagi dengan elemen pivot → pivot = 1
    const piv = M[k][k];
    if (Math.abs(piv - 1) > 1e-12) {
      for (let j = 0; j <= n; j++) M[k][j] /= piv;
      stepLog.push({
        label: `Normalisasi pivot: R${k + 1} ÷ (${fmtDec(piv, 4)}) → pivot = 1`,
        matrix: M.map(r => [...r])
      });
    }

    // Eliminasi semua baris lain di kolom k → nolkan
    for (let i = 0; i < n; i++) {
      if (i !== k && Math.abs(M[i][k]) > 1e-15) {
        const f = M[i][k];
        for (let j = 0; j <= n; j++) M[i][j] -= f * M[k][j];
        stepLog.push({
          label: `Eliminasi: R${i + 1} ← R${i + 1} − (${fmtDec(f, 4)}) × R${k + 1}`,
          matrix: M.map(r => [...r])
        });
      }
    }
  }

  // Solusi: kolom terakhir setelah RREF
  const sol = M.map(row => row[n]);

  // ---- Render hasil ----
  let html = `<div class="result-header">// HASIL — GAUSS-JORDAN (RREF)</div>`;
  html += `<div style="margin-bottom:12px">`;
  sol.forEach((v, i) => {
    html += `<div class="step-item">
      <span class="step-num">${names[i]}</span>
      <span style="color:var(--accent3);font-weight:700">${fmtDec(v, 6)}</span>
    </div>`;
  });
  html += `</div>`;

  // Verifikasi Ax = b
  html += `<div style="margin-top:10px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// VERIFIKASI Ax = b</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px"><table class="result-table"><thead><tr>
    <th>Persamaan</th><th>Sisi Kiri (Ax)</th><th>Sisi Kanan (b)</th><th>Selisih</th>
  </tr></thead><tbody>`;
  for (let i = 0; i < n; i++) {
    let lhs = 0;
    for (let j = 0; j < n; j++) lhs += A_coef[i][j] * sol[j];
    const diff = Math.abs(lhs - b_vec[i]);
    html += `<tr>
      <td>Persamaan ${i + 1}</td>
      <td>${fmtDec(lhs, 6)}</td>
      <td>${fmtDec(b_vec[i], 6)}</td>
      <td style="color:${diff < 1e-6 ? 'var(--accent3)' : 'var(--error)'}">${fmtDec(diff, 8)}</td>
    </tr>`;
  }
  html += `</tbody></table></div>`;

  // Langkah-langkah operasi baris
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// LANGKAH OPERASI BARIS ELEMENTER</div>`;
  html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:12px">`;
  stepLog.forEach((s, idx) => {
    html += `<div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">
        ${idx === 0 ? '' : `<span style="color:var(--accent);margin-right:6px">Langkah ${idx}:</span>`}${s.label}
      </div>
      ${matrixToTable(s.matrix, n, true)}
    </div>`;
  });
  html += `</div>`;

  showResult('gj', html);
  addHistory('Gauss-Jordan', `n=${n}`, sol.map((v, i) => `${names[i]}=${fmtDec(v, 4)}`).join(', '));
}

/* 2. INVERS MATRIKS */
function solveInvers() {
  clearErr('inv'); clearResult('inv');
  const nInput = document.getElementById('inv-n');
  if (!nInput) return;
  const n = parseInt(nInput.value);
  if (isNaN(n) || n < 1 || n > 5) { showErr('inv', 'n harus antara 1–5'); return; }

  let A;
  try { A = getMatrixFull('inv', n, n); }
  catch (e) { showErr('inv', e.message); return; }

  // Bangun [A | I]
  const M = A.map((row, i) => {
    const id = new Array(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });

  const stepLog = [{ label: 'Matriks augmented awal [A | I]', matrix: M.map(r => [...r]) }];

  for (let k = 0; k < n; k++) {
    let maxIdx = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > Math.abs(M[maxIdx][k])) maxIdx = i;
    }
    if (maxIdx !== k) {
      [M[k], M[maxIdx]] = [M[maxIdx], M[k]];
      stepLog.push({ label: `Tukar R${k + 1} ↔ R${maxIdx + 1}`, matrix: M.map(r => [...r]) });
    }
    if (Math.abs(M[k][k]) < 1e-12) {
      showErr('inv', 'Matriks singular — tidak dapat diinvers (determinan = 0)');
      return;
    }

    const piv = M[k][k];
    if (Math.abs(piv - 1) > 1e-12) {
      for (let j = 0; j < 2 * n; j++) M[k][j] /= piv;
      stepLog.push({ label: `Normalisasi: R${k + 1} ÷ (${fmtDec(piv, 4)})`, matrix: M.map(r => [...r]) });
    }
    for (let i = 0; i < n; i++) {
      if (i !== k && Math.abs(M[i][k]) > 1e-15) {
        const f = M[i][k];
        for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j];
        stepLog.push({ label: `R${i + 1} ← R${i + 1} − (${fmtDec(f, 4)}) × R${k + 1}`, matrix: M.map(r => [...r]) });
      }
    }
  }

  const Ainv = M.map(row => row.slice(n));

  let html = `<div class="result-header">// INVERS MATRIKS A⁻¹</div>`;
  html += `<div style="overflow-x:auto"><table class="result-table"><thead><tr>`;
  for (let j = 0; j < n; j++) html += `<th>Kol ${j + 1}</th>`;
  html += `</tr></thead><tbody>`;
  for (let i = 0; i < n; i++) {
    html += '<tr>' + Ainv[i].map(v => `<td style="text-align:right;color:var(--accent3)">${fmtDec(v, 6)}</td>`).join('') + '</tr>';
  }
  html += `</tbody></table></div>`;

  // Verifikasi A × A⁻¹ = I
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// VERIFIKASI A × A⁻¹ ≈ I</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px"><table class="result-table"><tbody>`;
  for (let i = 0; i < n; i++) {
    html += '<tr>';
    for (let j = 0; j < n; j++) {
      let val = 0;
      for (let k = 0; k < n; k++) val += A[i][k] * Ainv[k][j];
      const isOk = Math.abs(val - (i === j ? 1 : 0)) < 1e-6;
      html += `<td style="text-align:right;color:${isOk ? 'var(--accent3)' : 'var(--error)'}">${fmtDec(val, 4)}</td>`;
    }
    html += '</tr>';
  }
  html += `</tbody></table></div>`;

  // Langkah OBE
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// LANGKAH OPERASI BARIS ELEMENTER [A | I] → [I | A⁻¹]</div>`;
  html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:12px">`;
  stepLog.forEach((s, idx) => {
    html += `<div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">
        ${idx === 0 ? '' : `<span style="color:var(--accent);margin-right:6px">Langkah ${idx}:</span>`}${s.label}
      </div>
      ${matrixToTable(s.matrix, n, false)}
    </div>`;
  });
  html += `</div>`;

  showResult('inv', html);
  addHistory('Invers Matriks', `n=${n}`, 'A⁻¹ berhasil dihitung');
}

/* =====================================================================
   3. REGULA FALSI
   ===================================================================== */
function solveRegulaFalsi() {
  clearErr('rf'); clearResult('rf');
  const fxStr = document.getElementById('rf-fx').value.trim();
  let a = parseFloat(document.getElementById('rf-a').value);
  let b = parseFloat(document.getElementById('rf-b').value);
  const maxIter = parseInt(document.getElementById('rf-iter').value);

  if (!fxStr) { showErr('rf', 'Masukkan ekspresi f(x)'); return; }
  if (isNaN(a) || isNaN(b)) { showErr('rf', 'Nilai a atau b tidak valid'); return; }
  if (isNaN(maxIter) || maxIter < 1) { showErr('rf', 'Maks. iterasi tidak valid'); return; }

  if (a >= b) { showErr('rf', 'a harus lebih kecil dari b'); return; }

  let fa, fb;
  try { fa = evalFn(fxStr, a); fb = evalFn(fxStr, b); }
  catch (e) { showErr('rf', e.message); return; }

  if (Math.abs(fa) < 1e-14) { showErr('rf', `f(a) = 0 — a = ${fmtDec(a, 6)} sudah merupakan akar`); return; }
  if (Math.abs(fb) < 1e-14) { showErr('rf', `f(b) = 0 — b = ${fmtDec(b, 6)} sudah merupakan akar`); return; }
  if (fa * fb > 0) {
    showErr('rf', `f(a)·f(b) = ${fmtDec(fa * fb, 4)} > 0 — tidak ada akar di interval ini, atau jumlahnya genap. Ubah nilai a dan b.`);
    return;
  }

  const rows = [];
  let c = a, fc = fa, cPrev = a, converged = false, iterUsed = 0;

  for (let i = 1; i <= maxIter; i++) {
    cPrev = c;
    // Rumus Regula Falsi: c = (a·f(b) − b·f(a)) / (f(b) − f(a))
    c = (a * fb - b * fa) / (fb - fa);
    try { fc = evalFn(fxStr, c); }
    catch (e) { showErr('rf', e.message); return; }

    const errStep = i === 1 ? null : Math.abs(c - cPrev);
    rows.push({ i, a, b, fa, fb, c, fc, err: errStep });
    iterUsed = i;

  // Tanpa toleransi: berhenti hanya di iterasi maksimum.
    if (i === maxIter) converged = true;

    // Tentukan sub-interval berikutnya
    if (fa * fc < 0) {
      b = c; fb = fc;
    } else {
      a = c; fa = fc;
    }
  }

  let html = `<div class="result-header">// HASIL — REGULA FALSI</div>
    <div class="result-value">x ≈ ${fmtDec(c, 8)}</div>
    <div style="font-size:11px;color:var(--text-dim)">
      f(x) = ${fmtDec(fc, 8)} &nbsp;·&nbsp;
      ${iterUsed} iterasi &nbsp;·&nbsp;
      ${converged ? '✓ Konvergen (|f(c)| &lt; ε)' : '⚠ Berhenti di batas iterasi'}
    </div>`;

  // Rumus yang dipakai
  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.8">
    <b style="color:var(--accent3)">Rumus Regula Falsi:</b><br>
    c = [a·f(b) − b·f(a)] / [f(b) − f(a)]<br>
    <span style="font-size:10px;color:var(--text-faint)">Interval awal: [${fmtDec(parseFloat(document.getElementById('rf-a').value), 4)}, ${fmtDec(parseFloat(document.getElementById('rf-b').value), 4)}]</span>
  </div>`;


  // Tabel iterasi
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL ITERASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px"><table class="result-table"><thead><tr>
    <th>n</th><th>a</th><th>b</th><th>f(a)</th><th>f(b)</th>
    <th>c = xᵣ</th><th>f(c)</th><th>|Δc|</th>
  </tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr>
      <td>${r.i}</td>
      <td>${fmtDec(r.a, 6)}</td>
      <td>${fmtDec(r.b, 6)}</td>
      <td>${fmtDec(r.fa, 6)}</td>
      <td>${fmtDec(r.fb, 6)}</td>
      <td style="color:var(--accent3);font-weight:600">${fmtDec(r.c, 8)}</td>
      <td>${fmtDec(r.fc, 8)}</td>
      <td>${r.err === null ? '—' : fmtDec(r.err, 8)}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  showResult('rf', html);
  addHistory('Regula Falsi', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(c, 6)}`);

}

/* =====================================================================
   4. NEWTON-RAPHSON
   ===================================================================== */
function solveNewtonRaphson() {
  clearErr('nr'); clearResult('nr');
  const fxStr = document.getElementById('nr-fx').value.trim();
  const dfxStr = document.getElementById('nr-dfx').value.trim();
  let x = parseFloat(document.getElementById('nr-x0').value);
  const tol = parseFloat(document.getElementById('nr-tol').value);
  const maxIter = parseInt(document.getElementById('nr-iter').value);

  if (!fxStr || !dfxStr) { showErr('nr', 'Masukkan f(x) dan f′(x)'); return; }
  if (isNaN(x)) { showErr('nr', 'x₀ tidak valid'); return; }
  if (isNaN(tol) || tol <= 0) { showErr('nr', 'Toleransi harus positif'); return; }
  if (isNaN(maxIter) || maxIter < 1) { showErr('nr', 'Maks. iterasi tidak valid'); return; }

  const rows = [];
  let fx, dfx, xNew = x, converged = false, iterUsed = 0;

  for (let i = 1; i <= maxIter; i++) {
    try {
      fx = evalFn(fxStr, x);
      dfx = evalFn(dfxStr, x);
    } catch (e) { showErr('nr', e.message); return; }

    if (Math.abs(dfx) < 1e-12) {
      showErr('nr', `f′(x) ≈ 0 pada iterasi ${i} di x = ${fmtDec(x, 6)}. Coba tebakan awal yang berbeda.`);
      return;
    }

    // Rumus: xₙ₊₁ = xₙ − f(xₙ) / f′(xₙ)
    xNew = x - fx / dfx;
    const err = Math.abs(xNew - x);
    rows.push({ i, x, fx, dfx, xNew, err });
    iterUsed = i;
    x = xNew;
    if (err < tol) { converged = true; break; }
  }

  let html = `<div class="result-header">// HASIL — NEWTON-RAPHSON</div>
    <div class="result-value">x ≈ ${fmtDec(x, 8)}</div>
    <div style="font-size:11px;color:var(--text-dim)">
      f(x) ≈ ${fmtDec(evalFnSafe(fxStr, x), 8)} &nbsp;·&nbsp;
      ${iterUsed} iterasi &nbsp;·&nbsp;
      ${converged ? '✓ Konvergen' : '⚠ Batas iterasi'}
    </div>`;

  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.8">
    <b style="color:var(--accent3)">Rumus Newton-Raphson:</b><br>
    xₙ₊₁ = xₙ − f(xₙ) / f′(xₙ)
  </div>`;

  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL ITERASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>f(xₙ)</th><th>f′(xₙ)</th><th>xₙ₊₁ = xₙ − f/f′</th><th>|Δx|</th>
  </tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr>
      <td>${r.i}</td>
      <td>${fmtDec(r.x, 8)}</td>
      <td>${fmtDec(r.fx, 8)}</td>
      <td>${fmtDec(r.dfx, 8)}</td>
      <td style="color:var(--accent3);font-weight:600">${fmtDec(r.xNew, 8)}</td>
      <td>${fmtDec(r.err, 8)}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  showResult('nr', html);
  addHistory('Newton-Raphson', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(x, 6)}`);
}

function evalFnSafe(expr, x, y = 0) {
  try { return evalFn(expr, x, y); } catch { return NaN; }
}

/* =====================================================================
   5. INTERPOLASI LAGRANGE
   ===================================================================== */
function buildLagrangePoints() {
  const nInput = document.getElementById('lag-n');
  if (!nInput) return;
  const n = parseInt(nInput.value) || 4;
  const container = document.getElementById('lag-points-container');
  if (!container) return;

  const defaults = [[1,1],[2,4],[3,9],[4,16],[5,25],[6,36],[7,49],[8,64],[9,81],[10,100]];
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  for (let i = 0; i < n; i++) {
    const d = defaults[i] || [i + 1, (i + 1) * (i + 1)];
    html += `
      <div class="field"><label>x<sub>${i+1}</sub></label>
        <input type="number" id="lag-x${i}" value="${d[0]}" step="any">
      </div>
      <div class="field"><label>y<sub>${i+1}</sub></label>
        <input type="number" id="lag-y${i}" value="${d[1]}" step="any">
      </div>`;
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
  if (isNaN(xt)) { showErr('lag', 'Nilai x taksir tidak valid'); return; }

  const xs = [], ys = [];
  for (let i = 0; i < n; i++) {
    const xi = parseFloat(document.getElementById(`lag-x${i}`).value);
    const yi = parseFloat(document.getElementById(`lag-y${i}`).value);
    if (isNaN(xi) || isNaN(yi)) { showErr('lag', `Nilai titik ${i + 1} tidak valid`); return; }
    xs.push(xi); ys.push(yi);
  }

  // Cek titik x tidak ada yang sama
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(xs[i] - xs[j]) < 1e-14) {
        showErr('lag', `x${i+1} = x${j+1} = ${xs[i]} — nilai x tidak boleh duplikat`);
        return;
      }
    }
  }

  // Hitung P(x) = Σ yᵢ × Lᵢ(x)
  let Px = 0;
  const stepRows = [];
  for (let i = 0; i < n; i++) {
    let Li = 1;
    const factors = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const num = xt - xs[j];
        const den = xs[i] - xs[j];
        const frac = num / den;
        factors.push({ j, num, den, frac });
        Li *= frac;
      }
    }
    Px += Li * ys[i];
    stepRows.push({ i, xi: xs[i], yi: ys[i], Li, factors });
  }

  let html = `<div class="result-header">// HASIL — INTERPOLASI LAGRANGE</div>
    <div class="result-value">P(${xt}) ≈ ${fmtDec(Px, 8)}</div>`;

  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.8">
    <b style="color:var(--accent3)">Rumus Lagrange:</b><br>
    P(x) = Σᵢ yᵢ · Lᵢ(x) &nbsp;&nbsp; dengan &nbsp;&nbsp; Lᵢ(x) = Π_{j≠i} [(x − xⱼ) / (xᵢ − xⱼ)]
  </div>`;

  // Tabel ringkasan Lᵢ dan kontribusi
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL PERHITUNGAN Lᵢ(x)</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ</th><th>yᵢ</th><th>Lᵢ(${xt})</th><th>yᵢ · Lᵢ</th>
  </tr></thead><tbody>`;
  stepRows.forEach(s => {
    const contrib = s.Li * s.yi;
    html += `<tr>
      <td>${s.i + 1}</td>
      <td>${fmtDec(s.xi, 6)}</td>
      <td>${fmtDec(s.yi, 6)}</td>
      <td style="color:var(--accent3)">${fmtDec(s.Li, 8)}</td>
      <td>${fmtDec(contrib, 8)}</td>
    </tr>`;
  });
  html += `<tr style="border-top:2px solid var(--border)">
    <td colspan="4" style="font-weight:700;color:var(--text)">P(${xt}) = Σ yᵢ · Lᵢ</td>
    <td style="color:var(--accent);font-weight:700">${fmtDec(Px, 8)}</td>
  </tr></tbody></table></div>`;

  // Detail faktor tiap Lᵢ
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// RINCIAN PERHITUNGAN Lᵢ(x) — FAKTOR-FAKTOR</div>`;
  html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:14px">`;
  stepRows.forEach(s => {
    const prodStr = s.factors.map(f =>
      `(${fmtDec(f.num, 4)} / ${fmtDec(f.den, 4)}) = ${fmtDec(f.frac, 6)}`
    ).join(' × ');
    html += `<div style="background:var(--surface3);border-radius:6px;padding:10px 14px">
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;font-weight:600">
        L<sub>${s.i+1}</sub>(x) — untuk titik (x<sub>${s.i+1}</sub>=${fmtDec(s.xi,4)}, y<sub>${s.i+1}</sub>=${fmtDec(s.yi,4)})
      </div>
      <div style="font-size:11px;color:var(--text-faint);line-height:1.9">
        L<sub>${s.i+1}</sub>(${xt}) = ${prodStr}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <b style="color:var(--accent3)">${fmtDec(s.Li, 8)}</b><br>
        Kontribusi: ${fmtDec(s.yi,6)} × ${fmtDec(s.Li,8)} = <b style="color:var(--accent)">${fmtDec(s.Li * s.yi, 8)}</b>
      </div>
    </div>`;
  });
  html += `</div>`;

  showResult('lag', html);
  addHistory('Interpolasi Lagrange', `x=${xt}, n=${n}`, `P(${xt}) ≈ ${fmtDec(Px, 6)}`);
}

/* =====================================================================
   6. SIMPSON 1/3
   ===================================================================== */
function solveSimpson() {
  clearErr('simp'); clearResult('simp');
  const fxStr = document.getElementById('simp-fx').value.trim();
  const a = parseFloat(document.getElementById('simp-a').value);
  const b = parseFloat(document.getElementById('simp-b').value);
  let n = parseInt(document.getElementById('simp-n').value);

  if (!fxStr) { showErr('simp', 'Masukkan ekspresi f(x)'); return; }
  if (isNaN(a) || isNaN(b)) { showErr('simp', 'Nilai a atau b tidak valid'); return; }
  if (isNaN(n) || n < 2) { showErr('simp', 'n minimal 2'); return; }
  if (a >= b) { showErr('simp', 'a harus lebih kecil dari b'); return; }
  if (n % 2 !== 0) {
    n++;
    document.getElementById('simp-n').value = n;
  }

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
    else if (i % 2 !== 0) coef = 4;  // ganjil
    else coef = 2;                     // genap

    sum += coef * fx;
    points.push({ i, x, fx, coef });
  }

  // I = (h/3) × Σ(koef × f(xᵢ))
  const I = (h / 3) * sum;

  let html = `<div class="result-header">// HASIL — SIMPSON 1/3</div>
    <div class="result-value">∫f(x)dx ≈ ${fmtDec(I, 8)}</div>
    <div style="font-size:11px;color:var(--text-dim)">h = ${fmtDec(h, 6)} &nbsp;·&nbsp; n = ${n} subinterval &nbsp;·&nbsp; interval [${a}, ${b}]</div>`;

  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.8">
    <b style="color:var(--accent3)">Rumus Simpson 1/3 Komposit:</b><br>
    I ≈ (h/3) × [f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + … + 4f(xₙ₋₁) + f(xₙ)]<br>
    h = (b − a) / n = (${b} − ${a}) / ${n} = ${fmtDec(h, 6)}
  </div>`;

  // Tabel titik
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL TITIK INTEGRASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ = a + i·h</th><th>f(xᵢ)</th><th>Koefisien</th><th>Koef × f(xᵢ)</th>
  </tr></thead><tbody>`;
  points.forEach(p => {
    const typeLabel = p.i === 0 || p.i === n ? 'ujung (×1)' : (p.i % 2 !== 0 ? 'ganjil (×4)' : 'genap (×2)');
    html += `<tr>
      <td>${p.i}</td>
      <td>${fmtDec(p.x, 6)}</td>
      <td>${fmtDec(p.fx, 6)}</td>
      <td>${p.coef} <span style="color:var(--text-faint);font-size:9px">${typeLabel}</span></td>
      <td style="color:var(--accent3)">${fmtDec(p.coef * p.fx, 6)}</td>
    </tr>`;
  });
  html += `<tr style="border-top:2px solid var(--border)">
    <td colspan="4" style="font-weight:700;color:var(--text)">Σ (koef × f(xᵢ))</td>
    <td style="color:var(--accent);font-weight:700">${fmtDec(sum, 6)}</td>
  </tr></tbody></table></div>`;

  html += `<div style="margin-top:12px;font-size:11px;color:var(--text-dim);line-height:2;background:var(--surface3);border-radius:6px;padding:10px 14px">
    I = (h/3) × Σ = (${fmtDec(h,6)}/3) × ${fmtDec(sum,6)}<br>
    I = ${fmtDec(h/3,6)} × ${fmtDec(sum,6)} = <b style="color:var(--accent3);font-size:14px">${fmtDec(I,8)}</b>
  </div>`;

  // Estimasi galat
  try {
    const mid = (a + b) / 2;
    const hd = Math.max(h, 1e-3);
    const f2 = xx => evalFn(fxStr, xx);
    const f4 = (f2(mid-2*hd) - 4*f2(mid-hd) + 6*f2(mid) - 4*f2(mid+hd) + f2(mid+2*hd)) / Math.pow(hd, 4);
    const errEst = -((b-a) * Math.pow(h, 4) / 180) * f4;
    if (isFinite(errEst)) {
      html += `<div style="margin-top:12px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// ESTIMASI GALAT</div>
        <div style="margin-top:6px;font-size:11px;color:var(--text-dim)">
          E ≈ −(b−a)·h⁴·f⁽⁴⁾(ξ)/180 ≈ <b style="color:var(--warn)">${fmtDec(errEst, 8)}</b>
          <span style="color:var(--text-faint);font-size:10px"> (f⁽⁴⁾ diaproksimasi numerik di titik tengah)</span>
        </div>`;
    }
  } catch (e) { /* estimasi gagal, lewati */ }

  showResult('simp', html);
  addHistory('Simpson 1/3', `[${a},${b}], n=${n}`, `∫ ≈ ${fmtDec(I, 6)}`);
}

/* =====================================================================
   7. METODE EULER
   ===================================================================== */
function solveEuler() {
  clearErr('eu'); clearResult('eu');
  const fxyStr = document.getElementById('eu-fxy').value.trim();
  const x0 = parseFloat(document.getElementById('eu-x0').value);
  const y0 = parseFloat(document.getElementById('eu-y0').value);
  const h  = parseFloat(document.getElementById('eu-h').value);
  const xn = parseFloat(document.getElementById('eu-xn').value);

  if (!fxyStr) { showErr('eu', 'Masukkan ekspresi f(x,y)'); return; }
  if (isNaN(x0) || isNaN(y0)) { showErr('eu', 'Nilai x₀ atau y₀ tidak valid'); return; }
  if (isNaN(h) || h <= 0) { showErr('eu', 'h (step size) harus bilangan positif'); return; }
  if (isNaN(xn)) { showErr('eu', 'Nilai x akhir tidak valid'); return; }
  if (xn <= x0) { showErr('eu', 'x akhir harus lebih besar dari x₀'); return; }

  // Hitung jumlah langkah dari h dan rentang x
  const range = xn - x0;
  const steps = Math.round(range / h);
  if (steps < 1) { showErr('eu', 'Jumlah langkah terlalu kecil — perbesar rentang atau kecilkan h'); return; }
  if (steps > 500) { showErr('eu', `Jumlah langkah terlalu banyak (${steps}). Perbesar h atau perkecil rentang.`); return; }

  const rows = [];
  let x = x0, y = y0;
  rows.push({ i: 0, x, y, fxy: null });

  for (let i = 1; i <= steps; i++) {
    let fxy;
    try { fxy = evalFn(fxyStr, x, y); }
    catch (e) { showErr('eu', 'Iterasi ' + i + ': ' + e.message); return; }

    const xPrev = x, yPrev = y;
    // Rumus Euler: yₙ₊₁ = yₙ + h × f(xₙ, yₙ)
    y = y + h * fxy;
    x = x0 + i * h; // lebih presisi daripada x += h (menghindari akumulasi float error)
    rows.push({ i, x, y, fxy, xPrev, yPrev });
  }

  let html = `<div class="result-header">// HASIL — METODE EULER</div>
    <div class="result-value">y(${fmtDec(x, 4)}) ≈ ${fmtDec(y, 8)}</div>
    <div style="font-size:11px;color:var(--text-dim)">
      h = ${h} &nbsp;·&nbsp; ${steps} langkah &nbsp;·&nbsp; x: ${x0} → ${fmtDec(x, 6)}
    </div>`;

  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.8">
    <b style="color:var(--accent3)">Rumus Metode Euler:</b><br>
    yₙ₊₁ = yₙ + h · f(xₙ, yₙ) &nbsp;&nbsp; ; &nbsp;&nbsp; xₙ₊₁ = xₙ + h<br>
    Jumlah langkah n = (x akhir − x₀) / h = (${xn} − ${x0}) / ${h} = ${steps}
  </div>`;

  // Tabel langkah
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL LANGKAH EULER</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>yₙ</th><th>f(xₙ,yₙ)</th><th>h·f</th><th>yₙ₊₁ = yₙ + h·f</th>
  </tr></thead><tbody>`;
  rows.forEach(r => {
    if (r.i === 0) {
      html += `<tr>
        <td>0</td>
        <td>${fmtDec(r.x, 6)}</td>
        <td>${fmtDec(r.y, 6)}</td>
        <td>—</td><td>—</td>
        <td style="color:var(--text-faint)">(nilai awal)</td>
      </tr>`;
    } else {
      const hf = h * r.fxy;
      html += `<tr>
        <td>${r.i}</td>
        <td>${fmtDec(r.xPrev, 6)}</td>
        <td>${fmtDec(r.yPrev, 6)}</td>
        <td>${fmtDec(r.fxy, 6)}</td>
        <td>${fmtDec(hf, 6)}</td>
        <td style="color:var(--accent3);font-weight:600">${fmtDec(r.y, 8)}</td>
      </tr>`;
    }
  });
  html += `</tbody></table></div>`;

  showResult('eu', html);
  addHistory('Metode Euler', `y′=${fxyStr.substring(0,30)}, h=${h}`, `y(${fmtDec(x,4)}) ≈ ${fmtDec(y,6)}`);
}

/* =====================================================================
   INISIALISASI & EVENT BINDING
   ===================================================================== */
function initEvents() {
  // Toggle nav menu (dropdown)
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      const isOpen = sidebar.classList.contains('nav-open');
      sidebar.classList.toggle('nav-open', !isOpen);
      navToggle.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  // Bind semua nav-link
  document.querySelectorAll('.nav-link[data-method]').forEach(link => {
    const methodId = link.getAttribute('data-method');
    if (!methodId) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      showPanel(methodId);
    });
    link.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showPanel(methodId);
      }
    });
  });

  // History button mobile
  const histBtn = document.getElementById('mobileHistoryBtn');
  if (histBtn) histBtn.addEventListener('click', openMobileHistory);

  // Tutup history
  const closeHistBtn = document.getElementById('closeHistory');
  if (closeHistBtn) closeHistBtn.addEventListener('click', closeMobileHistory);

  // Overlay klik → tutup semua drawer
  const overlay = document.getElementById('mobileOverlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeNav();
      closeMobileHistory();
    });
  }

  // Auto-select input saat fokus
  document.addEventListener('focusin', e => {
    if (e.target && e.target.tagName === 'INPUT' &&
        (e.target.type === 'number' || e.target.type === 'text')) {
      e.target.select();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Build komponen awal
  buildGJMatrix();
  buildMatrix('inv');
  buildLagrangePoints();

  // Render histori
  renderHistory();

  // Bind semua event
  initEvents();

  // Tampilkan welcome screen
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'flex';
});

/* ===== Expose ke global (untuk onclick di HTML) ===== */
window.showPanel           = showPanel;
window.buildGJMatrix       = buildGJMatrix;
window.buildMatrix         = buildMatrix;
window.buildLagrangePoints = buildLagrangePoints;
window.solveGaussJordan    = solveGaussJordan;
window.solveInvers         = solveInvers;
window.solveRegulaFalsi    = solveRegulaFalsi;
window.solveNewtonRaphson  = solveNewtonRaphson;
window.solveLagrange       = solveLagrange;
window.solveSimpson        = solveSimpson;
window.solveEuler          = solveEuler;
window.clearResult         = clearResult;
window.deleteHistory       = deleteHistory;
window.clearHistory        = clearHistory;
