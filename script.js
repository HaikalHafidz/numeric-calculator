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

// == UTILITAS == //
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

function parseMathExpr(expr) {
  let s = expr.trim();
  if (!s) throw new Error('Ekspresi kosong');

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

/* Format angka desimal, hilangkan trailing zeros berlebih */
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

// == NAVIGASI PANEL == //
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

// == MATRIX INVERS  ==
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

// == MATRIX GAUSS-JORDAN ==
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

// == BANGUN INPUT TITIK DATA UNTUK LAGRANGE ==
function buildLagrangePoints() {
  const nInput = document.getElementById('lag-n');
  if (!nInput) return;
  const n = parseInt(nInput.value) || 4;
  const container = document.getElementById('lag-points-container');
  if (!container) return;

  let html = '<label style="display:block;margin-bottom:8px">Titik data (xᵢ, yᵢ)</label><div class="input-grid">';
  for (let i = 0; i < n; i++) {
    const xVal = i;
    const yVal = i * i;
    html += `
      <div class="field">
        <label>x<sub>${i}</sub></label>
        <input type="number" id="lag-x${i}" value="${xVal}" step="any">
      </div>
      <div class="field">
        <label>y<sub>${i}</sub></label>
        <input type="number" id="lag-y${i}" value="${yVal}" step="any">
      </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

// == AMBIL NILAI MATRIKS DARI DOM ==
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

// == Helper: nama variabel == //
function varName(i, n) {
  if (n <= 3) return ['x', 'y', 'z'][i];
  return 'x' + (i + 1);
}

// == Helper: render matriks augmented sebagai tabel HTML == //
function matrixToTable(M, n, isAugmented) {
  // isAugmented: menandakan M berisi [A | b] (kolom terakhir adalah konstanta)
  let html = '<table class="result-table" style="margin:4px 0"><tbody>';
  for (let i = 0; i < M.length; i++) {
    html += '<tr>';
    for (let j = 0; j < M[i].length; j++) {
      const isConst = isAugmented && j === n; // kolom konstanta (b)
      html += `<td style="${isConst ? 'border-left:2px solid var(--border);color:var(--accent3);' : ''}text-align:right;min-width:52px">${fmtDec(M[i][j], 4)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

// == 1. GAUSS-JORDAN ==
function solveGaussJordan() {
  clearErr('gj');
  clearResult('gj');

  const nInput = document.getElementById('gj-n');
  if (!nInput) { showErr('gj', 'Input tidak ditemukan'); return; }
  const n = parseInt(nInput.value);
  if (isNaN(n) || n < 2 || n > 6) { showErr('gj', 'Ukuran n harus antara 2–6'); return; }

  // --- Ambil matriks A (koefisien) ---
  let A_coef, b_vec;
  try {
    A_coef = getMatrixFull('gj-a', n, n);
  } catch (e) {
    showErr('gj', 'Matriks A: ' + e.message);
    return;
  }

  // --- Ambil vektor b (konstanta) ---
  b_vec = [];
  for (let i = 0; i < n; i++) {
    const el = document.getElementById(`gj-b-${i}`);
    if (!el) { showErr('gj', `Nilai b[${i + 1}] tidak ditemukan`); return; }
    const v = parseFloat(el.value);
    if (isNaN(v)) { showErr('gj', `Nilai b[${i + 1}] tidak valid`); return; }
    b_vec.push(v);
  }

  // --- Buat matriks augmented [A | b] ---
  const M = A_coef.map((row, i) => [...row, b_vec[i]]);

  // Nama variabel
  const names = Array.from({ length: n }, (_, i) => (n <= 3 ? ['x', 'y', 'z'][i] : 'x' + (i + 1)));

  // --- Log langkah-langkah ---
  const stepLog = [];

  // Fungsi untuk menyalin matriks (deep copy)
  function copyMatrix(mat) {
    return mat.map(row => [...row]);
  }

  // Fungsi untuk menyimpan langkah
  function logStep(label, matrix) {
    stepLog.push({
      label: label,
      matrix: copyMatrix(matrix)
    });
  }

  // Simpan langkah awal
  logStep('Matriks augmented awal [A | b]', M);

  // --- Proses Eliminasi Gauss-Jordan ---
  for (let k = 0; k < n; k++) {
    // STEP 1: Partial Pivoting — cari elemen terbesar di kolom k
    let maxIdx = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > Math.abs(M[maxIdx][k])) {
        maxIdx = i;
      }
    }

    // Jika perlu, tukar baris
    if (maxIdx !== k) {
      [M[k], M[maxIdx]] = [M[maxIdx], M[k]];
      logStep(`Tukar baris R${k+1} ↔ R${maxIdx+1} (pilih pivot terbesar)`, M);
    }

    // Cek apakah pivot = 0 (matriks singular)
    if (Math.abs(M[k][k]) < 1e-12) {
      showErr('gj', '❌ Matriks singular atau tidak memiliki solusi unik.');
      return;
    }

    // STEP 2: Normalisasi baris pivot (buat pivot = 1)
    const pivot = M[k][k];
    if (Math.abs(pivot - 1) > 1e-12) {
      for (let j = 0; j <= n; j++) {
        M[k][j] = M[k][j] / pivot;
      }
      logStep(`Normalisasi R${k+1} = R${k+1} ÷ ${fmtDec(pivot, 4)}`, M);
    }

    // STEP 3: Eliminasi semua baris lain (atas DAN bawah)
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const faktor = M[i][k];
      if (Math.abs(faktor) < 1e-15) continue;

      for (let j = 0; j <= n; j++) {
        M[i][j] = M[i][j] - faktor * M[k][j];
      }
      logStep(`Eliminasi R${i+1} = R${i+1} − (${fmtDec(faktor, 4)}) × R${k+1}`, M);
    }
  }

  // --- Ambil solusi (kolom terakhir) ---
  const solusi = M.map(row => row[n]);

  // --- BUILD HTML HASIL ---
  let html = '';

  // 1. HEADER HASIL
  html += `<div class="result-header">✅ HASIL — GAUSS-JORDAN (RREF)</div>`;

  // 2. SOLUSI
  html += `<div style="margin:10px 0;padding:12px 16px;background:var(--surface3);border-radius:6px;">`;
  solusi.forEach((v, i) => {
    html += `<div style="display:flex;gap:12px;padding:4px 0;font-size:14px;">
      <span style="color:var(--text-dim);min-width:40px;">${names[i]} =</span>
      <span style="color:var(--accent3);font-weight:700;">${fmtDec(v, 8)}</span>
    </div>`;
  });
  html += `</div>`;

  // 3. VERIFIKASI Ax = b
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// VERIFIKASI Ax = b</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px;"><table class="result-table"><thead><tr>
    <th>Persamaan</th><th>Ax (kiri)</th><th>b (kanan)</th><th>Selisih</th><th>Status</th>
  </tr></thead><tbody>`;

  let allValid = true;
  for (let i = 0; i < n; i++) {
    let lhs = 0;
    for (let j = 0; j < n; j++) {
      lhs += A_coef[i][j] * solusi[j];
    }
    const diff = Math.abs(lhs - b_vec[i]);
    const ok = diff < 1e-9;
    if (!ok) allValid = false;

    html += `<tr>
      <td>${i + 1}</td>
      <td>${fmtDec(lhs, 6)}</td>
      <td>${fmtDec(b_vec[i], 6)}</td>
      <td>${fmtDec(diff, 10)}</td>
      <td style="color:${ok ? 'var(--accent3)' : 'var(--error)'};">${ok ? '✅' : '❌'}</td>
    </tr>`;
  }
  html += `</tbody></table></div>`;

  if (allValid) {
    html += `<div style="margin-top:6px;font-size:11px;color:var(--accent3);">✅ Semua persamaan terverifikasi!</div>`;
  } else {
    html += `<div style="margin-top:6px;font-size:11px;color:var(--error);">⚠️ Ada selisih — periksa kembali input.</div>`;
  }

  // 4. PENJELASAN SINGKAT METODE
  html += `<div style="margin-top:16px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.9;">
    <b style="color:var(--accent3);">📘 Apa yang terjadi di sini?</b><br>
    1. Matriks augmented <b>[A | b]</b> dibentuk dari koefisien dan konstanta.<br>
    2. Untuk tiap kolom <b>k</b>, kita pilih pivot terbesar (partial pivoting) agar stabil.<br>
    3. Baris pivot dinormalisasi → elemen pivot menjadi <b>1</b>.<br>
    4. Semua baris lain dieliminasi pada kolom itu → elemennya menjadi <b>0</b>.<br>
    5. Ulangi untuk semua kolom → terbentuk <b>RREF</b> (matriks identitas di kiri).<br>
    6. Kolom terakhir = solusi <b>${names.join(', ')}</b>.
  </div>`;

  html += `<div style="margin-top:20px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// LANGKAH-LANGKAH PENGERJAAN</div>`;

  stepLog.forEach((step, idx) => {
    const isFirst = idx === 0;
    const stepNum = isFirst ? 'AWAL' : String(idx);

    html += `<div style="margin-top:12px;padding:8px 12px;background:var(--surface2);border-radius:6px;border-left:3px solid var(--accent);">
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;">
        <span style="color:var(--accent);font-weight:700;">Langkah ${stepNum}:</span> ${step.label}
      </div>
      ${matrixToTable(step.matrix, n, true)}
    </div>`;
  });

  html += `<div style="margin-top:16px;padding:8px 12px;background:var(--surface2);border-radius:6px;border-left:3px solid var(--accent3);">
    <div style="font-size:11px;color:var(--accent3);margin-bottom:6px;font-weight:700;">✅ HASIL AKHIR — RREF</div>
    ${matrixToTable(M, n, true)}
  </div>`;

  showResult('gj', html);

  // Simpan ke histori
  addHistory(
    'Gauss-Jordan',
    `n=${n}`,
    solusi.map((v, i) => `${names[i]}=${fmtDec(v, 6)}`).join(', ')
  );
}

// === 2. INVERS MATRIKS  ===
function solveInvers() {
  clearErr('inv');
  clearResult('inv');

  const nInput = document.getElementById('inv-n');
  if (!nInput) return;
  const n = parseInt(nInput.value);
  if (isNaN(n) || n < 1 || n > 5) {
    showErr('inv', 'n harus antara 1–5');
    return;
  }

  let A;
  try {
    A = getMatrixFull('inv', n, n);
  } catch (e) {
    showErr('inv', e.message);
    return;
  }

  const M = A.map((row, i) => {
    const id = new Array(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });

  const stepLog = [];
  function copyMatrix(mat) { return mat.map(r => [...r]); }
  function logStep(label, matrix) {
    stepLog.push({ label, matrix: copyMatrix(matrix) });
  }

  logStep('Matriks augmented awal [A | I]', M);

  let singular = false;

  for (let k = 0; k < n; k++) {
    let maxIdx = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > Math.abs(M[maxIdx][k])) maxIdx = i;
    }
    if (maxIdx !== k) {
      [M[k], M[maxIdx]] = [M[maxIdx], M[k]];
      logStep(`Tukar R${k+1} ↔ R${maxIdx+1} (pilih pivot terbesar)`, M);
    }

    // Cek singular
    if (Math.abs(M[k][k]) < 1e-12) {
      singular = true;
      showErr('inv', '❌ Matriks SINGULAR — tidak memiliki invers (determinan = 0)');
      return;
    }

    // --- Normalisasi baris pivot ---
    const pivot = M[k][k];
    if (Math.abs(pivot - 1) > 1e-12) {
      for (let j = 0; j < 2 * n; j++) {
        M[k][j] = M[k][j] / pivot;
      }
      logStep(`Normalisasi R${k+1} = R${k+1} ÷ ${fmtDec(pivot, 4)}`, M);
    }

    // --- Eliminasi semua baris lain ---
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const faktor = M[i][k];
      if (Math.abs(faktor) < 1e-15) continue;

      for (let j = 0; j < 2 * n; j++) {
        M[i][j] = M[i][j] - faktor * M[k][j];
      }
      logStep(`Eliminasi R${i+1} = R${i+1} − (${fmtDec(faktor, 4)}) × R${k+1}`, M);
    }
  }

  // --- Ambil A⁻¹ (separuh kanan) ---
  const Ainv = M.map(row => row.slice(n));

  // --- BUILD HTML ---
  let html = '';

  // 1. HEADER
  html += `<div class="result-header">✅ HASIL — INVERS MATRIKS A⁻¹</div>`;

  // 2. TAMPILAN A⁻¹
  html += `<div style="margin:10px 0;padding:12px 16px;background:var(--surface3);border-radius:6px;overflow-x:auto;">
    <div style="font-size:10px;color:var(--text-faint);margin-bottom:6px;">A⁻¹ =</div>
    <table class="result-table"><tbody>`;
  for (let i = 0; i < n; i++) {
    html += '<tr>';
    for (let j = 0; j < n; j++) {
      html += `<td style="text-align:right;color:var(--accent3);font-weight:600;min-width:60px;">${fmtDec(Ainv[i][j], 8)}</td>`;
    }
    html += '</tr>';
  }
  html += `</tbody></table></div>`;

  // 3. VERIFIKASI A × A⁻¹ = I
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// VERIFIKASI A × A⁻¹ = I</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px;"><table class="result-table"><thead><tr>`;
  for (let j = 0; j < n; j++) html += `<th>Kol ${j+1}</th>`;
  html += `</tr></thead><tbody>`;

  let allIdentity = true;
  for (let i = 0; i < n; i++) {
    html += '<tr>';
    for (let j = 0; j < n; j++) {
      let val = 0;
      for (let k = 0; k < n; k++) val += A[i][k] * Ainv[k][j];
      const expected = (i === j) ? 1 : 0;
      const ok = Math.abs(val - expected) < 1e-9;
      if (!ok) allIdentity = false;
      html += `<td style="text-align:right;color:${ok ? 'var(--accent3)' : 'var(--error)'};">${fmtDec(val, 6)}</td>`;
    }
    html += '</tr>';
  }
  html += `</tbody></table></div>`;

  if (allIdentity) {
    html += `<div style="margin-top:6px;font-size:11px;color:var(--accent3);">✅ A × A⁻¹ = I — invers benar!</div>`;
  } else {
    html += `<div style="margin-top:6px;font-size:11px;color:var(--error);">⚠️ Ada ketidaksesuaian — periksa input.</div>`;
  }

  // 4. PENJELASAN
  html += `<div style="margin-top:16px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.9;">
    <b style="color:var(--accent3);">📘 Cara Mencari Invers Matriks:</b><br>
    1. Bentuk matriks augmented <b>[A | I]</b> (tempel identitas di kanan).<br>
    2. Lakukan OBE (sama seperti Gauss-Jordan) sampai sisi kiri menjadi <b>I</b>.<br>
    3. Sisi kanan yang tersisa adalah <b>A⁻¹</b>.<br>
    4. Syarat: matriks harus <b>persegi</b> dan <b>non-singular</b> (det ≠ 0).
  </div>`;

  // 5. LANGKAH-LANGKAH
  html += `<div style="margin-top:20px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// LANGKAH-LANGKAH OBE [A | I] → [I | A⁻¹]</div>`;

  stepLog.forEach((step, idx) => {
    const isFirst = idx === 0;
    const stepNum = isFirst ? 'AWAL' : String(idx);

    html += `<div style="margin-top:12px;padding:8px 12px;background:var(--surface2);border-radius:6px;border-left:3px solid var(--accent);">
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;">
        <span style="color:var(--accent);font-weight:700;">Langkah ${stepNum}:</span> ${step.label}
      </div>
      ${matrixToTable(step.matrix, n, false)}
    </div>`;
  });

  // 6. HASIL AKHIR
  html += `<div style="margin-top:16px;padding:8px 12px;background:var(--surface2);border-radius:6px;border-left:3px solid var(--accent3);">
    <div style="font-size:11px;color:var(--accent3);margin-bottom:6px;font-weight:700;">✅ HASIL AKHIR [I | A⁻¹]</div>
    ${matrixToTable(M, n, false)}
  </div>`;

  showResult('inv', html);
  addHistory('Invers Matriks', `n=${n}`, 'A⁻¹ berhasil dihitung');
}

// === 3. REGULA FALSI — PERBAIKAN LENGKAP ===
function solveRegulaFalsi() {
  clearErr('rf');
  clearResult('rf');

  const fxStr = document.getElementById('rf-fx').value.trim();
  let a = parseFloat(document.getElementById('rf-a').value);
  let b = parseFloat(document.getElementById('rf-b').value);
  const tol = 1e-7;  // Toleransi bawaan
  const maxIter = 100;

  if (!fxStr) { showErr('rf', 'Masukkan ekspresi f(x)'); return; }
  if (isNaN(a) || isNaN(b)) { showErr('rf', 'Nilai a atau b tidak valid'); return; }
  if (a >= b) { showErr('rf', 'a harus lebih kecil dari b'); return; }

  let fa, fb;
  try {
    fa = evalFn(fxStr, a);
    fb = evalFn(fxStr, b);
  } catch (e) {
    showErr('rf', e.message);
    return;
  }

  // Cek apakah ujung interval sudah akar
  if (Math.abs(fa) < 1e-14) {
    showResult('rf', `<div class="result-header">✅ HASIL — REGULA FALSI</div>
      <div class="result-value">x = ${fmtDec(a, 8)}</div>
      <div style="font-size:11px;color:var(--accent3);">✅ f(a) = 0 — a adalah akar!</div>`);
    addHistory('Regula Falsi', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(a, 6)}`);
    return;
  }
  if (Math.abs(fb) < 1e-14) {
    showResult('rf', `<div class="result-header">✅ HASIL — REGULA FALSI</div>
      <div class="result-value">x = ${fmtDec(b, 8)}</div>
      <div style="font-size:11px;color:var(--accent3);">✅ f(b) = 0 — b adalah akar!</div>`);
    addHistory('Regula Falsi', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(b, 6)}`);
    return;
  }

  if (fa * fb > 0) {
    showErr('rf', `❌ f(a)·f(b) = ${fmtDec(fa * fb, 4)} > 0 — tidak ada akar di interval ini.`);
    return;
  }

  const rows = [];
  let c = a, fc = fa, cPrev = a;
  let converged = false;
  let iterUsed = 0;

  for (let i = 1; i <= maxIter; i++) {
    cPrev = c;

    // --- Rumus Regula Falsi ---
    c = (a * fb - b * fa) / (fb - fa);

    try {
      fc = evalFn(fxStr, c);
    } catch (e) {
      showErr('rf', e.message);
      return;
    }

    const errStep = i === 1 ? null : Math.abs(c - cPrev);
    rows.push({ i, a, b, fa, fb, c, fc, err: errStep });
    iterUsed = i;

    // Cek konvergensi
    if (Math.abs(fc) < tol || (errStep !== null && errStep < tol)) {
      converged = true;
      break;
    }

    // Update interval
    if (fa * fc < 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }
  }

  // --- BUILD HTML ---
  let html = '';

  // 1. HEADER
  html += `<div class="result-header">✅ HASIL — REGULA FALSI</div>`;

  // 2. HASIL
  html += `<div style="margin:10px 0;padding:12px 16px;background:var(--surface3);border-radius:6px;">
    <div style="display:flex;gap:12px;font-size:16px;">
      <span style="color:var(--text-dim);">x ≈</span>
      <span style="color:var(--accent3);font-weight:700;">${fmtDec(c, 10)}</span>
    </div>
    <div style="display:flex;gap:20px;margin-top:6px;font-size:11px;color:var(--text-dim);">
      <span>f(x) = ${fmtDec(fc, 10)}</span>
      <span>Iterasi: ${iterUsed}</span>
      <span style="color:${converged ? 'var(--accent3)' : 'var(--warn)'};">${converged ? '✅ Konvergen' : '⚠️ Batas iterasi'}</span>
    </div>
  </div>`;

  // 3. RUMUS
  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.9;">
    <b style="color:var(--accent3);">📘 Rumus Regula Falsi:</b><br>
    c = <span style="color:var(--text);">(a·f(b) − b·f(a)) / (f(b) − f(a))</span><br>
    Interval awal: [${fmtDec(parseFloat(document.getElementById('rf-a').value), 4)}, ${fmtDec(parseFloat(document.getElementById('rf-b').value), 4)}]<br>
    <span style="font-size:10px;color:var(--text-faint);">Metode tertutup — selalu konvergen karena akar terkurung.</span>
  </div>`;

  // 4. TABEL ITERASI
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// TABEL ITERASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px;"><table class="result-table"><thead><tr>
    <th>n</th><th>a</th><th>b</th><th>f(a)</th><th>f(b)</th>
    <th style="color:var(--accent3);">c = xᵣ</th><th>f(c)</th><th>|Δc|</th>
  </tr></thead><tbody>`;

  rows.forEach(r => {
    const isConverged = Math.abs(r.fc) < tol;
    html += `<tr>
      <td>${r.i}</td>
      <td>${fmtDec(r.a, 6)}</td>
      <td>${fmtDec(r.b, 6)}</td>
      <td>${fmtDec(r.fa, 6)}</td>
      <td>${fmtDec(r.fb, 6)}</td>
      <td style="color:${isConverged ? 'var(--accent3)' : 'var(--text)'};font-weight:600;">${fmtDec(r.c, 8)}</td>
      <td style="color:${Math.abs(r.fc) < tol ? 'var(--accent3)' : 'var(--text-dim)'};">${fmtDec(r.fc, 8)}</td>
      <td>${r.err === null ? '—' : fmtDec(r.err, 8)}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  showResult('rf', html);
  addHistory('Regula Falsi', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(c, 6)}`);
}

// === 4. NEWTON-RAPHSON — PERBAIKAN LENGKAP ===
function solveNewtonRaphson() {
  clearErr('nr');
  clearResult('nr');

  const fxStr = document.getElementById('nr-fx').value.trim();
  const dfxStr = document.getElementById('nr-dfx').value.trim();
  let x = parseFloat(document.getElementById('nr-x0').value);
  const tol = 1e-8;
  const maxIter = 100;

  if (!fxStr || !dfxStr) { showErr('nr', 'Masukkan f(x) dan f′(x)'); return; }
  if (isNaN(x)) { showErr('nr', 'x₀ tidak valid'); return; }

  const rows = [];
  let fx, dfx, xNew = x;
  let converged = false;
  let iterUsed = 0;

  for (let i = 0; i < maxIter; i++) {
    try {
      fx = evalFn(fxStr, x);
      dfx = evalFn(dfxStr, x);
    } catch (e) {
      showErr('nr', e.message);
      return;
    }

    if (Math.abs(dfx) < 1e-12) {
      showErr('nr', `❌ f′(x) ≈ 0 pada iterasi ${i} di x = ${fmtDec(x, 6)}`);
      return;
    }

    // --- Rumus Newton-Raphson ---
    xNew = x - fx / dfx;
    const err = Math.abs(xNew - x);

    rows.push({ i, x, fx, dfx, xNew, err });
    iterUsed = i + 1;

    if (Math.abs(fx) < tol || err < tol) {
      converged = true;
      x = xNew;
      break;
    }

    x = xNew;
  }

  // --- BUILD HTML ---
  let html = '';

  // 1. HEADER
  html += `<div class="result-header">✅ HASIL — NEWTON-RAPHSON</div>`;

  // 2. HASIL
  html += `<div style="margin:10px 0;padding:12px 16px;background:var(--surface3);border-radius:6px;">
    <div style="display:flex;gap:12px;font-size:16px;">
      <span style="color:var(--text-dim);">x ≈</span>
      <span style="color:var(--accent3);font-weight:700;">${fmtDec(x, 10)}</span>
    </div>
    <div style="display:flex;gap:20px;margin-top:6px;font-size:11px;color:var(--text-dim);">
      <span>f(x) = ${fmtDec(evalFnSafe(fxStr, x), 10)}</span>
      <span>Iterasi: ${iterUsed}</span>
      <span style="color:${converged ? 'var(--accent3)' : 'var(--warn)'};">${converged ? '✅ Konvergen' : '⚠️ Batas iterasi'}</span>
    </div>
  </div>`;

  // 3. RUMUS
  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.9;">
    <b style="color:var(--accent3);">📘 Rumus Newton-Raphson:</b><br>
    xₙ₊₁ = xₙ − <span style="color:var(--text);">f(xₙ) / f′(xₙ)</span><br>
    <span style="font-size:10px;color:var(--text-faint);">Metode terbuka — konvergensi kuadratik jika tebakan awal baik.</span>
  </div>`;

  // 4. TABEL ITERASI
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// TABEL ITERASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px;"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>f(xₙ)</th><th>f′(xₙ)</th>
    <th style="color:var(--accent3);">xₙ₊₁</th><th>|Δx|</th>
  </tr></thead><tbody>`;

  rows.forEach(r => {
    const isConverged = r.err < tol;
    html += `<tr>
      <td>${r.i}</td>
      <td>${fmtDec(r.x, 8)}</td>
      <td>${fmtDec(r.fx, 8)}</td>
      <td>${fmtDec(r.dfx, 8)}</td>
      <td style="color:${isConverged ? 'var(--accent3)' : 'var(--text)'};font-weight:600;">${fmtDec(r.xNew, 8)}</td>
      <td>${fmtDec(r.err, 8)}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  showResult('nr', html);
  addHistory('Newton-Raphson', `f(x)=${fxStr.substring(0, 30)}`, `x ≈ ${fmtDec(x, 6)}`);
}

// === 5. INTERPOLASI LAGRANGE === //
function solveLagrange() {
  clearErr('lag');
  clearResult('lag');

  const nInput = document.getElementById('lag-n');
  if (!nInput) return;
  const n = parseInt(nInput.value);
  const xt = parseFloat(document.getElementById('lag-xt').value);

  if (isNaN(xt)) { showErr('lag', 'Nilai x taksir tidak valid'); return; }

  const xs = [],
    ys = [];
  for (let i = 0; i < n; i++) {
    const xi = parseFloat(document.getElementById(`lag-x${i}`).value);
    const yi = parseFloat(document.getElementById(`lag-y${i}`).value);
    if (isNaN(xi) || isNaN(yi)) {
      showErr('lag', `Nilai titik ${i + 1} tidak valid`);
      return;
    }
    xs.push(xi);
    ys.push(yi);
  }

  // Cek duplikat x
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(xs[i] - xs[j]) < 1e-14) {
        showErr('lag', `❌ x${i+1} = x${j+1} = ${xs[i]} — nilai x tidak boleh duplikat`);
        return;
      }
    }
  }

  // --- Hitung P(x) = Σ yᵢ × Lᵢ(x) ---
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

  // --- BUILD HTML ---
  let html = '';

  // 1. HEADER
  html += `<div class="result-header">✅ HASIL — INTERPOLASI LAGRANGE</div>`;

  // 2. HASIL
  html += `<div style="margin:10px 0;padding:12px 16px;background:var(--surface3);border-radius:6px;">
    <div style="display:flex;gap:12px;font-size:16px;">
      <span style="color:var(--text-dim);">P(${fmtDec(xt, 4)}) ≈</span>
      <span style="color:var(--accent3);font-weight:700;">${fmtDec(Px, 10)}</span>
    </div>
    <div style="font-size:11px;color:var(--text-dim);margin-top:4px;">
      Polinom derajat ${n-1} melalui ${n} titik data
    </div>
  </div>`;

  // 3. RUMUS
  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.9;">
    <b style="color:var(--accent3);">📘 Rumus Interpolasi Lagrange:</b><br>
    P(x) = Σᵢ yᵢ · Lᵢ(x) &nbsp; dengan &nbsp; Lᵢ(x) = Πⱼ≠ᵢ [(x − xⱼ) / (xᵢ − xⱼ)]<br>
    <span style="font-size:10px;color:var(--text-faint);">Polinom derajat n−1 yang melalui semua titik data.</span>
  </div>`;

  // 4. TABEL Lᵢ
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// TABEL PERHITUNGAN Lᵢ(x) DAN KONTRIBUSI</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px;"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ</th><th>yᵢ</th>
    <th style="color:var(--accent3);">Lᵢ(${fmtDec(xt, 4)})</th>
    <th>yᵢ · Lᵢ</th>
  </tr></thead><tbody>`;

  stepRows.forEach(s => {
    const contrib = s.Li * s.yi;
    html += `<tr>
      <td>${s.i + 1}</td>
      <td>${fmtDec(s.xi, 6)}</td>
      <td>${fmtDec(s.yi, 6)}</td>
      <td style="color:var(--accent3);font-weight:600;">${fmtDec(s.Li, 8)}</td>
      <td>${fmtDec(contrib, 8)}</td>
    </tr>`;
  });

  html += `<tr style="border-top:2px solid var(--border);">
    <td colspan="4" style="font-weight:700;color:var(--text);">P(${fmtDec(xt, 4)}) = Σ yᵢ · Lᵢ</td>
    <td style="color:var(--accent);font-weight:700;font-size:14px;">${fmtDec(Px, 8)}</td>
  </tr></tbody></table></div>`;

  // 5. DETAIL FAKTOR
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// RINCIAN PERHITUNGAN Lᵢ(x)</div>`;

  stepRows.forEach(s => {
    const prodStr = s.factors.map(f =>
      `(${fmtDec(f.num, 4)}/${fmtDec(f.den, 4)})=${fmtDec(f.frac, 6)}`
    ).join(' × ');

    html += `<div style="margin-top:8px;padding:8px 12px;background:var(--surface2);border-radius:6px;border-left:3px solid var(--accent);">
      <div style="font-size:11px;color:var(--text-dim);">
        <b>L<sub>${s.i+1}</sub>(${fmtDec(xt, 4)})</b> — titik (${fmtDec(s.xi, 4)}, ${fmtDec(s.yi, 4)})
      </div>
      <div style="font-size:10px;color:var(--text-faint);line-height:1.9;">
        = ${prodStr}<br>
        = <b style="color:var(--accent3);">${fmtDec(s.Li, 8)}</b><br>
        Kontribusi: ${fmtDec(s.yi, 6)} × ${fmtDec(s.Li, 8)} = <b style="color:var(--accent);">${fmtDec(s.Li * s.yi, 8)}</b>
      </div>
    </div>`;
  });

  showResult('lag', html);
  addHistory('Interpolasi Lagrange', `x=${fmtDec(xt, 4)}, n=${n}`, `P(${fmtDec(xt, 4)})≈${fmtDec(Px, 6)}`);
}

// === 6. SIMPSON 1/3 === //
function solveSimpson() {
  clearErr('simp');
  clearResult('simp');

  const fxStr = document.getElementById('simp-fx').value.trim();
  const a = parseFloat(document.getElementById('simp-a').value);
  const b = parseFloat(document.getElementById('simp-b').value);
  let n = parseInt(document.getElementById('simp-n').value);

  if (!fxStr) { showErr('simp', 'Masukkan ekspresi f(x)'); return; }
  if (isNaN(a) || isNaN(b)) { showErr('simp', 'Nilai a atau b tidak valid'); return; }
  if (isNaN(n) || n < 2) { showErr('simp', 'n minimal 2'); return; }
  if (a >= b) { showErr('simp', 'a harus lebih kecil dari b'); return; }

  // Pastikan n genap
  let nOriginal = n;
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
    try {
      fx = evalFn(fxStr, x);
    } catch (e) {
      showErr('simp', e.message);
      return;
    }

    let coef;
    let typeLabel;
    if (i === 0 || i === n) {
      coef = 1;
      typeLabel = 'ujung (×1)';
    } else if (i % 2 !== 0) {
      coef = 4;
      typeLabel = 'ganjil (×4)';
    } else {
      coef = 2;
      typeLabel = 'genap (×2)';
    }

    sum += coef * fx;
    points.push({ i, x, fx, coef, typeLabel });
  }

  const I = (h / 3) * sum;

  // --- BUILD HTML ---
  let html = '';

  // 1. HEADER
  html += `<div class="result-header">✅ HASIL — SIMPSON 1/3</div>`;

  // 2. HASIL
  html += `<div style="margin:10px 0;padding:12px 16px;background:var(--surface3);border-radius:6px;">
    <div style="display:flex;gap:12px;font-size:16px;">
      <span style="color:var(--text-dim);">∫ₐᵇ f(x)dx ≈</span>
      <span style="color:var(--accent3);font-weight:700;">${fmtDec(I, 10)}</span>
    </div>
    <div style="display:flex;gap:20px;margin-top:6px;font-size:11px;color:var(--text-dim);">
      <span>h = ${fmtDec(h, 6)}</span>
      <span>n = ${n} subinterval</span>
      <span>interval [${fmtDec(a, 4)}, ${fmtDec(b, 4)}]</span>
      ${n !== nOriginal ? `<span style="color:var(--warn);">⚠️ n dinaikkan dari ${nOriginal} ke ${n} (harus genap)</span>` : ''}
    </div>
  </div>`;

  // 3. RUMUS
  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.9;">
    <b style="color:var(--accent3);">📘 Rumus Simpson 1/3 Komposit:</b><br>
    I ≈ (h/3) × <span style="color:var(--text);">[f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + … + 4f(xₙ₋₁) + f(xₙ)]</span><br>
    h = (b−a)/n = ${fmtDec((b-a)/n, 6)} &nbsp; (n harus genap)<br>
    <span style="font-size:10px;color:var(--text-faint);">Eksak untuk polinom berderajat ≤ 3.</span>
  </div>`;

  // 4. TABEL TITIK
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// TABEL TITIK INTEGRASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px;"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ = a + i·h</th><th>f(xᵢ)</th><th>Koefisien</th>
    <th style="color:var(--accent3);">Koef × f(xᵢ)</th>
  </tr></thead><tbody>`;

  points.forEach(p => {
    html += `<tr>
      <td>${p.i}</td>
      <td>${fmtDec(p.x, 6)}</td>
      <td>${fmtDec(p.fx, 6)}</td>
      <td>${p.coef} <span style="color:var(--text-faint);font-size:9px;">${p.typeLabel}</span></td>
      <td style="color:var(--accent3);font-weight:600;">${fmtDec(p.coef * p.fx, 6)}</td>
    </tr>`;
  });

  html += `<tr style="border-top:2px solid var(--border);">
    <td colspan="4" style="font-weight:700;color:var(--text);">Σ (koef × f(xᵢ))</td>
    <td style="color:var(--accent);font-weight:700;font-size:14px;">${fmtDec(sum, 6)}</td>
  </tr></tbody></table></div>`;

  // 5. PERHITUNGAN AKHIR
  html += `<div style="margin-top:12px;padding:10px 14px;background:var(--surface2);border-radius:6px;font-size:12px;color:var(--text-dim);line-height:2;">
    I = (h/3) × Σ = (${fmtDec(h, 6)}/3) × ${fmtDec(sum, 6)}<br>
    I = ${fmtDec(h/3, 6)} × ${fmtDec(sum, 6)} = <b style="color:var(--accent3);font-size:16px;">${fmtDec(I, 10)}</b>
  </div>`;

  // 6. ESTIMASI GALAT
  try {
    const mid = (a + b) / 2;
    const hd = Math.max(h, 1e-3);
    const f2 = xx => evalFn(fxStr, xx);
    const f4 = (f2(mid - 2 * hd) - 4 * f2(mid - hd) + 6 * f2(mid) - 4 * f2(mid + hd) + f2(mid + 2 * hd)) / Math.pow(hd, 4);

    if (isFinite(f4)) {
      const errEst = -((b - a) * Math.pow(h, 4) / 180) * f4;
      html += `<div style="margin-top:12px;padding:8px 12px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);">
        <b style="color:var(--warn);">📊 Estimasi Galat:</b><br>
        E ≈ −(b−a)·h⁴·f⁽⁴⁾(ξ)/180 ≈ <b style="color:var(--warn);">${fmtDec(errEst, 10)}</b>
        <span style="font-size:9px;color:var(--text-faint);"> (f⁽⁴⁾ diaproksimasi numerik di titik tengah)</span>
      </div>`;
    }
  } catch (e) { /* untuk estimasi gagal, maka lewati */ }

  showResult('simp', html);
  addHistory('Simpson 1/3', `[${fmtDec(a, 4)},${fmtDec(b, 4)}], n=${n}`, `∫≈${fmtDec(I, 6)}`);
}

// === 7. METODE EULER  === 
function solveEuler() {
  clearErr('eu');
  clearResult('eu');

  const fxyStr = document.getElementById('eu-fxy').value.trim();
  const x0 = parseFloat(document.getElementById('eu-x0').value);
  const y0 = parseFloat(document.getElementById('eu-y0').value);
  const h = parseFloat(document.getElementById('eu-h').value);
  const xn = parseFloat(document.getElementById('eu-xn').value);

  if (!fxyStr) { showErr('eu', 'Masukkan ekspresi f(x,y)'); return; }
  if (isNaN(x0) || isNaN(y0)) { showErr('eu', 'Nilai x₀ atau y₀ tidak valid'); return; }
  if (isNaN(h) || h <= 0) { showErr('eu', 'h (step size) harus bilangan positif'); return; }
  if (isNaN(xn)) { showErr('eu', 'Nilai x akhir tidak valid'); return; }
  if (xn <= x0) { showErr('eu', 'x akhir harus lebih besar dari x₀'); return; }

  const range = xn - x0;
  const steps = Math.round(range / h);
  if (steps < 1) { showErr('eu', 'Jumlah langkah terlalu kecil'); return; }
  if (steps > 500) { showErr('eu', `Jumlah langkah terlalu banyak (${steps}). Perbesar h.`); return; }

  const rows = [];
  let x = x0,
    y = y0;

  // Langkah 0: kondisi awal
  rows.push({ i: 0, x, y, fxy: null, yPrev: null, hf: null });

  for (let i = 1; i <= steps; i++) {
    let fxy;
    try {
      fxy = evalFn(fxyStr, x, y);
    } catch (e) {
      showErr('eu', 'Iterasi ' + i + ': ' + e.message);
      return;
    }

    const xPrev = x,
      yPrev = y;
    const hf = h * fxy;

    // --- Rumus Euler ---
    y = y + hf;
    x = x0 + i * h;

    rows.push({ i, x, y, fxy, yPrev, hf });
  }

  // --- BUILD HTML ---
  let html = '';

  // 1. HEADER
  html += `<div class="result-header">✅ HASIL — METODE EULER</div>`;

  // 2. HASIL
  html += `<div style="margin:10px 0;padding:12px 16px;background:var(--surface3);border-radius:6px;">
    <div style="display:flex;gap:12px;font-size:16px;">
      <span style="color:var(--text-dim);">y(${fmtDec(x, 4)}) ≈</span>
      <span style="color:var(--accent3);font-weight:700;">${fmtDec(y, 10)}</span>
    </div>
    <div style="display:flex;gap:20px;margin-top:6px;font-size:11px;color:var(--text-dim);">
      <span>h = ${fmtDec(h, 4)}</span>
      <span>${steps} langkah</span>
      <span>interval [${fmtDec(x0, 4)}, ${fmtDec(xn, 4)}]</span>
    </div>
  </div>`;

  // 3. RUMUS
  html += `<div style="margin-top:14px;padding:10px 14px;background:var(--surface3);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:1.9;">
    <b style="color:var(--accent3);">📘 Rumus Metode Euler:</b><br>
    yₙ₊₁ = yₙ + h · <span style="color:var(--text);">f(xₙ, yₙ)</span><br>
    xₙ₊₁ = xₙ + h &nbsp; (n = ${steps} langkah)<br>
    <span style="font-size:10px;color:var(--text-faint);">Metode orde-1 — galat global O(h).</span>
  </div>`;

  // 4. TABEL LANGKAH
  html += `<div style="margin-top:16px;font-size:10px;color:var(--text-faint);letter-spacing:1px;">// TABEL LANGKAH EULER</div>`;
  html += `<div style="overflow-x:auto;margin-top:6px;"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>yₙ</th><th>f(xₙ,yₙ)</th><th>h·f</th>
    <th style="color:var(--accent3);">yₙ₊₁</th>
  </tr></thead><tbody>`;

  rows.forEach(r => {
    if (r.i === 0) {
      html += `<tr>
        <td>0</td>
        <td>${fmtDec(r.x, 6)}</td>
        <td style="color:var(--accent3);font-weight:600;">${fmtDec(r.y, 8)}</td>
        <td>—</td><td>—</td>
        <td style="color:var(--text-faint);">(nilai awal)</td>
      </tr>`;
    } else {
      html += `<tr>
        <td>${r.i}</td>
        <td>${fmtDec(r.x - h, 6)}</td>
        <td>${fmtDec(r.yPrev, 8)}</td>
        <td>${fmtDec(r.fxy, 6)}</td>
        <td>${fmtDec(r.hf, 6)}</td>
        <td style="color:var(--accent3);font-weight:600;">${fmtDec(r.y, 8)}</td>
      </tr>`;
    }
  });
  html += `</tbody></table></div>`;

  html += `<div style="margin-top:12px;padding:10px 14px;background:var(--surface2);border-radius:6px;font-size:11px;color:var(--text-dim);line-height:2;">
    <b style="color:var(--accent3);">📊 Ringkasan:</b><br>
    Nilai awal: (x₀, y₀) = (${fmtDec(x0, 4)}, ${fmtDec(y0, 4)})<br>
    Nilai akhir: y(${fmtDec(x, 4)}) ≈ <b style="color:var(--accent);">${fmtDec(y, 10)}</b><br>
    <span style="font-size:10px;color:var(--text-faint);">Gunakan h yang lebih kecil untuk akurasi lebih tinggi.</span>
  </div>`;

  showResult('eu', html);
  addHistory('Metode Euler', `y′=${fxyStr.substring(0, 30)}, h=${fmtDec(h, 4)}`, `y(${fmtDec(x, 4)})≈${fmtDec(y, 6)}`);
}

/* INISIALISASI & EVENT BINDING */
function initEvents() {
  // -- Toggle menu "Pilih Metode" --
  // Pakai event delegation di document supaya tetap jalan walau ada
  // masalah timing render/DOM di browser tertentu (Safari iOS, WebView Android, dll).
  document.addEventListener('click', e => {
    const toggle = e.target.closest('#navToggle');
    if (!toggle) return;
    e.preventDefault();
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('nav-open');
    sidebar.classList.toggle('nav-open', !isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });

  // -- Pilih metode dari daftar (delegation, bukan bind satu-satu) --
  document.addEventListener('click', e => {
    const link = e.target.closest('.nav-link[data-method]');
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    const methodId = link.getAttribute('data-method');
    if (methodId) showPanel(methodId);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const link = e.target.closest('.nav-link[data-method]');
    if (!link) return;
    e.preventDefault();
    const methodId = link.getAttribute('data-method');
    if (methodId) showPanel(methodId);
  });

  // History button mobile
  const histBtn = document.getElementById('mobileHistoryBtn');
  if (histBtn) histBtn.addEventListener('click', openMobileHistory);

  const closeHistBtn = document.getElementById('closeHistory');
  if (closeHistBtn) closeHistBtn.addEventListener('click', closeMobileHistory);

  const overlay = document.getElementById('mobileOverlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeNav();
      closeMobileHistory();
    });
  }

  document.addEventListener('focusin', e => {
    if (e.target && e.target.tagName === 'INPUT' &&
      (e.target.type === 'number' || e.target.type === 'text')) {
      e.target.select();
    }
  });
}

/* Jalankan fn dan catat ke console jika gagal, tanpa menghentikan
   inisialisasi bagian lain (mis. supaya tombol menu tetap ter-bind
   walau salah satu komponen gagal dibangun). */
function safeInit(name, fn) {
  try { fn(); }
  catch (e) { console.error(`Gagal inisialisasi "${name}":`, e); }
}

document.addEventListener('DOMContentLoaded', () => {
  safeInit('gauss-jordan matrix', buildGJMatrix);
  safeInit('invers matrix', () => buildMatrix('inv'));
  safeInit('lagrange points', buildLagrangePoints);
  safeInit('history', renderHistory);
  safeInit('event bindings', initEvents);

  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'flex';
});

/* = untuk onclick dari HTML = */
window.showPanel = showPanel;
window.buildGJMatrix = buildGJMatrix;
window.buildMatrix = buildMatrix;
window.buildLagrangePoints = buildLagrangePoints;
window.solveGaussJordan = solveGaussJordan;
window.solveInvers = solveInvers;
window.solveRegulaFalsi = solveRegulaFalsi;
window.solveNewtonRaphson = solveNewtonRaphson;
window.solveLagrange = solveLagrange;
window.solveSimpson = solveSimpson;
window.solveEuler = solveEuler;
window.clearResult = clearResult;
window.deleteHistory = deleteHistory;
window.clearHistory = clearHistory;
