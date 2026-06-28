/* ============================================================
   NumCalc — script.js
   Perbaikan mobile: satu event per aksi, tidak ada dobel-trigger,
   panel display:block (bukan contents), scroll ke atas setelah pilih.
   ============================================================ */

// ── HISTORY ──────────────────────────────────────────────────
let history = JSON.parse(localStorage.getItem('numcalc-history') || '[]');

function saveHistory() { localStorage.setItem('numcalc-history', JSON.stringify(history)); }

function addHistory(method, params, resultText) {
  history.unshift({ id: Date.now(), method, params, resultText: resultText.substring(0, 100), time: new Date().toLocaleString('id-ID') });
  if (history.length > 50) history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('history-list');
  const count = document.getElementById('hist-count');
  if (!list) return;
  count.textContent = history.length;
  if (!history.length) { list.innerHTML = '<div class="history-empty"><span>🕒</span>Belum ada perhitungan</div>'; return; }
  list.innerHTML = history.map(h => `
    <div class="history-item">
      <button class="history-del" onclick="deleteHistory(${h.id})">×</button>
      <div class="history-method">${h.method}</div>
      <div class="history-result">${h.resultText}</div>
      <div class="history-time">${h.time}</div>
    </div>`).join('');
}

function deleteHistory(id) { history = history.filter(h => h.id !== id); saveHistory(); renderHistory(); }
function clearHistory() { if (confirm('Hapus semua histori?')) { history = []; saveHistory(); renderHistory(); } }

// ── UTILITIES ─────────────────────────────────────────────────
function showErr(id, msg) { const el = document.getElementById(id + '-err'); if (el) { el.textContent = msg; el.classList.add('show'); } }
function clearErr(id) { const el = document.getElementById(id + '-err'); if (el) { el.textContent = ''; el.classList.remove('show'); } }
function showResult(id, html) { const el = document.getElementById(id + '-result'); if (el) { el.innerHTML = html; el.classList.add('show'); } }
function clearResult(id) { const el = document.getElementById(id + '-result'); if (el) { el.innerHTML = ''; el.classList.remove('show'); } clearErr(id); }

function parseMathExpr(expr) {
  let s = expr.trim();
  if (!s) throw new Error('Ekspresi kosong');
  s = s.replace(/\^/g, '**');
  const FN = 'sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|sqrt|abs|exp|log10|log2|log|ln|pow|min|max|floor|ceil|round|sign|cbrt';
  s = s.replace(new RegExp(`(\\d)\\s*(?=(${FN})\\b)`, 'g'), '$1*');
  s = s.replace(/(\d)\s*(?=[a-zA-Z(])/g, '$1*');
  s = s.replace(/\)\s*(?=[\w(])/g, ')*');
  s = s.replace(/(?<![a-zA-Z])([xy])\(/g, '$1*(');
  s = s.replace(/\bln\s*\(/g, 'log(');
  s = s.replace(/\bpi\b/gi, 'PI');
  s = s.replace(/\be\b(?!\d)/g, 'E');
  return s;
}

function evalFn(expr, x, y) {
  let parsed;
  try { parsed = parseMathExpr(expr); } catch (e) { throw new Error('Ekspresi tidak valid: ' + expr); }
  try {
    const fn = new Function('x', 'y', 'Math', `with(Math){ return (${parsed}); }`);
    const result = fn(x, y, Math);
    if (typeof result !== 'number' || isNaN(result)) throw new Error('Hasil bukan angka');
    return result;
  } catch (e) { throw new Error('Ekspresi tidak valid: "' + expr + '" — ' + (e.message || '')); }
}

function fmt(n, d = 6) {
  if (typeof n !== 'number' || isNaN(n)) return n;
  if (Math.abs(n) < 1e-9) n = 0;
  let out = n.toFixed(d);
  if (out.includes('.')) out = out.replace(/0+$/, '').replace(/\.$/, '.0');
  return out;
}
function fmtDec(n, d = 6) {
  if (typeof n !== 'number' || isNaN(n)) return '—';
  if (Math.abs(n) < 1e-9) n = 0;
  return n.toFixed(d);
}

// ── PANEL NAVIGATION ─────────────────────────────────────────
let currentPanel = null;

function showPanel(id) {
  // Sembunyikan welcome
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'none';

  // Sembunyikan semua panel
  document.querySelectorAll('.panel').forEach(p => { p.style.display = 'none'; });

  // Tampilkan panel baru (display:block, bukan contents)
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.style.display = 'block';

  // Update active menu
  document.querySelectorAll('.menu-item').forEach(m => {
    m.classList.toggle('active', m.getAttribute('data-method') === id);
  });

  currentPanel = id;

  // Init form jika perlu
  if (id === 'gauss-jordan') buildMatrix('gj');
  if (id === 'invers') buildMatrix('inv');
  if (id === 'gauss-seidel') buildMatrix('gs');
  if (id === 'lagrange') buildLagrangePoints();

  // Scroll konten ke atas
  const main = document.getElementById('main-content');
  if (main) main.scrollTop = 0;
}

// ── MOBILE UI ─────────────────────────────────────────────────
function closeAll() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('historyPanel')?.classList.remove('open');
  document.getElementById('mobileMethodSheet')?.classList.remove('open');
  document.getElementById('mobileOverlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

function openSidebar() {
  closeAll();
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('mobileOverlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openHistory() {
  closeAll();
  document.getElementById('historyPanel')?.classList.add('open');
  document.getElementById('mobileOverlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openMethodSheet() {
  closeAll();
  document.getElementById('mobileMethodSheet')?.classList.add('open');
  document.getElementById('mobileOverlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Satu fungsi pilih metode — dipakai dari sidebar, sheet, maupun tombol apapun
function selectMethod(methodId) {
  closeAll();
  // Beri jeda minimal 1 frame agar sheet sempat hilang secara visual
  requestAnimationFrame(() => showPanel(methodId));
}

// ── MATRIX BUILDER ───────────────────────────────────────────
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

  for (let j = 0; j < cols; j++) {
    const label = isInv ? `a<sub>${j+1}</sub>` : (j < n ? `a<sub>${j+1}</sub>` : 'b');
    html += `<div style="text-align:center;font-size:9px;color:var(--text-faint);padding:2px">${label}</div>`;
  }
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
      if (!el) throw new Error(`Elemen matriks [${i+1}][${j+1}] tidak ditemukan`);
      const v = parseFloat(el.value);
      if (isNaN(v)) throw new Error(`Nilai matriks [${i+1}][${j+1}] tidak valid`);
      M[i].push(v);
    }
  }
  return M;
}

function varName(i, n) { return n <= 3 ? ['x','y','z'][i] : 'x'+(i+1); }

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
  return html + '</tbody></table>';
}

// ── GAUSS-JORDAN ──────────────────────────────────────────────
function solveGaussJordan() {
  clearErr('gj'); clearResult('gj');
  const n = parseInt(document.getElementById('gj-n').value);
  let M;
  try { M = getMatrix('gj', n, n+1); } catch(e) { showErr('gj', e.message); return; }

  const A = M.map(row => [...row]);
  const names = Array.from({length:n}, (_,i) => varName(i,n));
  const stepLog = [{label:'Matriks augmented awal [A | b]', matrix: A.map(r=>[...r])}];

  for (let k = 0; k < n; k++) {
    let maxIdx = k;
    for (let i = k+1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[maxIdx][k])) maxIdx = i;
    if (maxIdx !== k) { [A[k], A[maxIdx]] = [A[maxIdx], A[k]]; stepLog.push({label:`Tukar baris R${k+1} ↔ R${maxIdx+1}`, matrix:A.map(r=>[...r])}); }
    if (Math.abs(A[k][k]) < 1e-12) { showErr('gj', 'Matriks singular — tidak ada solusi unik'); return; }
    const piv = A[k][k];
    if (Math.abs(piv-1) > 1e-12) { for (let j=0;j<=n;j++) A[k][j]/=piv; stepLog.push({label:`R${k+1} → R${k+1} ÷ ${fmtDec(piv,4)}`, matrix:A.map(r=>[...r])}); }
    for (let i=0;i<n;i++) {
      if (i!==k && Math.abs(A[i][k])>1e-15) {
        const f=A[i][k]; for(let j=0;j<=n;j++) A[i][j]-=f*A[k][j];
        stepLog.push({label:`R${i+1} → R${i+1} − (${fmtDec(f,4)}) × R${k+1}`, matrix:A.map(r=>[...r])});
      }
    }
  }
  const x = A.map(row=>row[n]);
  let html = `<div class="result-header">// HASIL — GAUSS-JORDAN (RREF)</div>`;
  html += x.map((v,i)=>`<div class="step-item"><span class="step-num">${names[i]}</span><span>= ${fmtDec(v,6)}</span></div>`).join('');
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// LANGKAH OBE</div><div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">`;
  stepLog.forEach((s,idx) => { html += `<div><div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">${idx===0?'':('Langkah '+idx+': ')}${s.label}</div>${matrixToTable(s.matrix,n,true)}</div>`; });
  html += '</div>';
  showResult('gj', html);
  addHistory('Gauss-Jordan', `n=${n}`, x.map((v,i)=>`${names[i]}=${fmtDec(v,4)}`).join(', '));
}

// ── INVERS MATRIKS ────────────────────────────────────────────
function solveInvers() {
  clearErr('inv'); clearResult('inv');
  const n = parseInt(document.getElementById('inv-n').value);
  let A;
  try { A = getMatrix('inv', n, n); } catch(e) { showErr('inv', e.message); return; }
  const M = A.map((row,i) => { const id=new Array(n).fill(0); id[i]=1; return [...row,...id]; });
  const stepLog = [{label:'Matriks augmented awal [A | I]', matrix:M.map(r=>[...r])}];
  for (let k=0;k<n;k++) {
    let maxIdx=k; for(let i=k+1;i<n;i++) if(Math.abs(M[i][k])>Math.abs(M[maxIdx][k])) maxIdx=i;
    if (maxIdx!==k) { [M[k],M[maxIdx]]=[M[maxIdx],M[k]]; stepLog.push({label:`Tukar R${k+1} ↔ R${maxIdx+1}`, matrix:M.map(r=>[...r])}); }
    if (Math.abs(M[k][k])<1e-12) { showErr('inv','Matriks singular — tidak dapat diinvers'); return; }
    const piv=M[k][k]; if(Math.abs(piv-1)>1e-12) { for(let j=0;j<2*n;j++) M[k][j]/=piv; stepLog.push({label:`R${k+1} ÷ ${fmtDec(piv,4)}`, matrix:M.map(r=>[...r])}); }
    for (let i=0;i<n;i++) { if(i!==k&&Math.abs(M[i][k])>1e-15) { const f=M[i][k]; for(let j=0;j<2*n;j++) M[i][j]-=f*M[k][j]; stepLog.push({label:`R${i+1} − (${fmtDec(f,4)}) × R${k+1}`, matrix:M.map(r=>[...r])}); } }
  }
  const Ainv = M.map(row=>row.slice(n));
  let html = `<div class="result-header">// INVERS MATRIKS A⁻¹</div><table class="result-table"><tbody>`;
  for (let i=0;i<n;i++) html += '<tr>'+Ainv[i].map(v=>`<td style="text-align:right">${fmtDec(v,4)}</td>`).join('')+'</tr>';
  html += '</table>';
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// LANGKAH OBE [A | I] → [I | A⁻¹]</div><div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">`;
  stepLog.forEach((s,idx)=>{ html+=`<div><div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">${idx===0?'':('Langkah '+idx+': ')}${s.label}</div>${matrixToTable(s.matrix,n,true)}</div>`; });
  html += '</div>';
  showResult('inv', html);
  addHistory('Invers Matriks', `n=${n}`, 'Invers berhasil dihitung');
}

// ── GAUSS-SEIDEL ──────────────────────────────────────────────
function solveGaussSeidel() {
  clearErr('gs'); clearResult('gs');
  const n = parseInt(document.getElementById('gs-n').value);
  const tol = parseFloat(document.getElementById('gs-tol').value);
  const maxIter = parseInt(document.getElementById('gs-iter').value);
  let M;
  try { M = getMatrix('gs', n, n+1); } catch(e) { showErr('gs', e.message); return; }

  const A = M.map(r => r.slice(0, n));
  const b = M.map(r => r[n]);
  const names = Array.from({length:n},(_,i)=>varName(i,n));

  // Cek diagonally dominant (peringatan, bukan blok)
  let isDomWarn = false;
  for (let i=0;i<n;i++) {
    const diag = Math.abs(A[i][i]);
    const rest = A[i].reduce((s,v,j)=>j!==i?s+Math.abs(v):s,0);
    if (diag < rest) { isDomWarn = true; break; }
  }

  let x = new Array(n).fill(0);
  const iterRows = [];
  let converged = false;

  for (let iter=1; iter<=maxIter; iter++) {
    const xOld = [...x];
    for (let i=0;i<n;i++) {
      let sigma = b[i];
      for (let j=0;j<n;j++) if (j!==i) sigma -= A[i][j]*x[j];
      if (Math.abs(A[i][i]) < 1e-12) { showErr('gs', `Diagonal A[${i+1}][${i+1}] = 0 — tidak bisa dibagi`); return; }
      x[i] = sigma / A[i][i];
    }
    const maxErr = Math.max(...x.map((v,i) => Math.abs(v - xOld[i])));
    iterRows.push({iter, x:[...x], maxErr});
    if (maxErr < tol) { converged = true; break; }
  }

  let html = `<div class="result-header">// HASIL — GAUSS-SEIDEL</div>`;
  if (isDomWarn) html += `<div style="font-size:11px;color:var(--warn);margin-bottom:8px">⚠ Matriks mungkin tidak diagonally dominant — konvergensi tidak dijamin.</div>`;
  html += x.map((v,i)=>`<div class="step-item"><span class="step-num">${names[i]}</span><span>= ${fmtDec(v,6)}</span></div>`).join('');
  html += `<div style="font-size:11px;color:var(--text-dim);margin-top:8px">${iterRows.length} iterasi · ${converged?'konvergen':'berhenti di batas iterasi'}</div>`;
  html += `<div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL ITERASI</div>`;
  html += `<div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr><th>n</th>${names.map(nm=>`<th>${nm}</th>`).join('')}<th>max|Δ|</th></tr></thead><tbody>`;
  iterRows.forEach(r => {
    html += `<tr><td>${r.iter}</td>${r.x.map(v=>`<td style="color:var(--accent3)">${fmtDec(v,6)}</td>`).join('')}<td>${fmtDec(r.maxErr,6)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  showResult('gs', html);
  addHistory('Gauss-Seidel', `n=${n}`, x.map((v,i)=>`${names[i]}=${fmtDec(v,4)}`).join(', '));
}

// ── REGULA FALSI ─────────────────────────────────────────────
function solveRegulaFalsi() {
  clearErr('rf'); clearResult('rf');
  const fxStr = document.getElementById('rf-fx').value.trim();
  let a = parseFloat(document.getElementById('rf-a').value);
  let b = parseFloat(document.getElementById('rf-b').value);
  const tol = parseFloat(document.getElementById('rf-tol').value);
  const maxIter = parseInt(document.getElementById('rf-iter').value);

  if (!fxStr) { showErr('rf','Masukkan f(x)'); return; }
  if (isNaN(a)||isNaN(b)||isNaN(tol)||isNaN(maxIter)) { showErr('rf','Nilai tidak valid'); return; }
  if (a>=b) { showErr('rf','a harus < b'); return; }
  let fa, fb;
  try { fa=evalFn(fxStr,a); fb=evalFn(fxStr,b); } catch(e) { showErr('rf',e.message); return; }
  if (fa*fb>0) { showErr('rf',`f(a)·f(b) > 0 — interval tidak mengurung akar`); return; }

  const rows=[]; let c=a, fc=fa, converged=false, iterUsed=0;
  for (let i=1;i<=maxIter;i++) {
    const cPrev=c;
    c=(a*fb-b*fa)/(fb-fa); fc=evalFn(fxStr,c);
    const errStep = i===1?null:Math.abs(c-cPrev);
    rows.push({i,a,b,fa,fb,c,fc,err:errStep}); iterUsed=i;
    if (Math.abs(fc)<tol) { converged=true; break; }
    if (fa*fc<0) { b=c; fb=fc; } else { a=c; fa=fc; }
  }

  let html = `<div class="result-header">// HASIL — REGULA FALSI</div>
    <div class="result-value">x ≈ ${fmtDec(c,6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">${iterUsed} iterasi · ${converged?'konvergen':'batas iterasi tercapai'}</div>
    <div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL ITERASI</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>a</th><th>b</th><th>f(a)</th><th>f(b)</th><th>xᵣ</th><th>f(xᵣ)</th><th>|Δx|</th>
    </tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr><td>${r.i}</td><td>${fmtDec(r.a,6)}</td><td>${fmtDec(r.b,6)}</td><td>${fmtDec(r.fa,6)}</td><td>${fmtDec(r.fb,6)}</td>
    <td style="color:var(--accent3)">${fmtDec(r.c,6)}</td><td>${fmtDec(r.fc,6)}</td><td>${r.err===null?'—':fmtDec(r.err,6)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  showResult('rf', html);
  addHistory('Regula Falsi', `f(x)=${fxStr.substring(0,30)}`, `x ≈ ${fmtDec(c,6)}`);
}

// ── NEWTON-RAPHSON ───────────────────────────────────────────
function solveNewtonRaphson() {
  clearErr('nr'); clearResult('nr');
  const fxStr = document.getElementById('nr-fx').value.trim();
  const dfxStr = document.getElementById('nr-dfx').value.trim();
  let x = parseFloat(document.getElementById('nr-x0').value);
  const tol = parseFloat(document.getElementById('nr-tol').value);
  const maxIter = parseInt(document.getElementById('nr-iter').value);

  if (!fxStr||!dfxStr) { showErr('nr','Masukkan f(x) dan f\'(x)'); return; }
  const rows=[]; let converged=false, iterUsed=0;
  for (let i=1;i<=maxIter;i++) {
    let fx, dfx;
    try { fx=evalFn(fxStr,x); dfx=evalFn(dfxStr,x); } catch(e) { showErr('nr',e.message); return; }
    if (Math.abs(dfx)<1e-12) { showErr('nr',`f'(x) ≈ 0 pada iterasi ${i} — coba tebakan awal lain`); return; }
    const xNew=x-fx/dfx; const err=Math.abs(xNew-x);
    rows.push({i,x,fx,dfx,xNew,err}); iterUsed=i; x=xNew;
    if (err<tol) { converged=true; break; }
  }

  let html = `<div class="result-header">// HASIL — NEWTON-RAPHSON</div>
    <div class="result-value">x ≈ ${fmtDec(x,6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">${iterUsed} iterasi · ${converged?'konvergen':'batas iterasi tercapai'}</div>
    <div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL ITERASI</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>f(xₙ)</th><th>f'(xₙ)</th><th>xₙ₊₁</th><th>|Δx|</th>
    </tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr><td>${r.i}</td><td>${fmtDec(r.x,6)}</td><td>${fmtDec(r.fx,6)}</td><td>${fmtDec(r.dfx,6)}</td>
    <td style="color:var(--accent3)">${fmtDec(r.xNew,6)}</td><td>${fmtDec(r.err,6)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  showResult('nr', html);
  addHistory('Newton-Raphson', `f(x)=${fxStr.substring(0,30)}`, `x ≈ ${fmtDec(x,6)}`);
}

// ── LAGRANGE ─────────────────────────────────────────────────
function buildLagrangePoints() {
  const n = parseInt(document.getElementById('lag-n')?.value) || 4;
  const container = document.getElementById('lag-points-container');
  if (!container) return;
  const defaults = [[1,1],[2,4],[3,9],[4,16],[5,25],[6,36],[7,49],[8,64],[9,81],[10,100]];
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  for (let i=0;i<n;i++) {
    const d = defaults[i]||[i+1,(i+1)**2];
    html += `<div class="field"><label>x${i+1}</label><input type="number" id="lag-x${i}" value="${d[0]}" step="any"></div>
             <div class="field"><label>y${i+1}</label><input type="number" id="lag-y${i}" value="${d[1]}" step="any"></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function solveLagrange() {
  clearErr('lag'); clearResult('lag');
  const n = parseInt(document.getElementById('lag-n').value);
  const xt = parseFloat(document.getElementById('lag-xt').value);
  if (isNaN(xt)) { showErr('lag','x taksir tidak valid'); return; }
  const xs=[], ys=[];
  for (let i=0;i<n;i++) {
    const xi=parseFloat(document.getElementById(`lag-x${i}`).value);
    const yi=parseFloat(document.getElementById(`lag-y${i}`).value);
    if (isNaN(xi)||isNaN(yi)) { showErr('lag',`Nilai titik ${i+1} tidak valid`); return; }
    xs.push(xi); ys.push(yi);
  }

  let Px=0;
  const stepRows=[];
  for (let i=0;i<n;i++) {
    let Li=1; const factors=[];
    for (let j=0;j<n;j++) {
      if (i!==j) {
        if (Math.abs(xs[i]-xs[j])<1e-15) { showErr('lag','Nilai x tidak boleh sama'); return; }
        const num=xt-xs[j], den=xs[i]-xs[j], frac=num/den;
        factors.push({j,num,den,frac}); Li*=frac;
      }
    }
    Px+=Li*ys[i]; stepRows.push({i,xi:xs[i],yi:ys[i],Li,factors});
  }

  let html = `<div class="result-header">// HASIL — INTERPOLASI LAGRANGE</div>
    <div class="result-value">P(${xt}) ≈ ${fmtDec(Px,6)}</div>
    <div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL Lᵢ(x)</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ</th><th>yᵢ</th><th>Lᵢ(x)</th><th>yᵢ·Lᵢ(x)</th></tr></thead><tbody>`;
  stepRows.forEach(s => {
    html += `<tr><td>${s.i+1}</td><td>${fmtDec(s.xi,4)}</td><td>${fmtDec(s.yi,4)}</td>
    <td style="color:var(--accent3)">${fmtDec(s.Li,6)}</td><td>${fmtDec(s.Li*s.yi,6)}</td></tr>`;
  });
  html += `<tr><td colspan="4" style="font-weight:700">Σ yᵢ·Lᵢ(x)</td><td style="color:var(--accent)"><b>${fmtDec(Px,6)}</b></td></tr>`;
  html += '</tbody></table></div>';
  showResult('lag', html);
  addHistory('Interpolasi Lagrange', `x=${xt}, n=${n}`, `P(${xt}) ≈ ${fmtDec(Px,6)}`);
}

// ── SIMPSON 1/3 ──────────────────────────────────────────────
function solveSimpson() {
  clearErr('simp'); clearResult('simp');
  const fxStr = document.getElementById('simp-fx').value.trim();
  const a = parseFloat(document.getElementById('simp-a').value);
  const b = parseFloat(document.getElementById('simp-b').value);
  let n = parseInt(document.getElementById('simp-n').value);

  if (!fxStr) { showErr('simp','Masukkan f(x)'); return; }
  if (isNaN(a)||isNaN(b)||isNaN(n)) { showErr('simp','Nilai tidak valid'); return; }
  if (a>=b) { showErr('simp','a harus < b'); return; }
  if (n<2) { showErr('simp','n minimal 2'); return; }
  if (n%2!==0) { n++; document.getElementById('simp-n').value=n; }

  const h=(b-a)/n; const points=[]; let sum=0;
  for (let i=0;i<=n;i++) {
    const x=a+i*h; let fx;
    try { fx=evalFn(fxStr,x); } catch(e) { showErr('simp',e.message); return; }
    const coef = (i===0||i===n)?1:(i%2===0?2:4);
    points.push({i,x,fx,coef}); sum+=coef*fx;
  }
  const I=(h/3)*sum;

  let html = `<div class="result-header">// HASIL — SIMPSON 1/3</div>
    <div class="result-value">∫f(x)dx ≈ ${fmtDec(I,6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">h = ${fmtDec(h,6)} · n = ${n}</div>
    <div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL TITIK</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>i</th><th>xᵢ</th><th>f(xᵢ)</th><th>Koef.</th><th>Koef.×f</th></tr></thead><tbody>`;
  points.forEach(p => {
    html += `<tr><td>${p.i}</td><td>${fmtDec(p.x,4)}</td><td>${fmtDec(p.fx,6)}</td><td>${p.coef}</td><td>${fmtDec(p.coef*p.fx,6)}</td></tr>`;
  });
  html += `</tbody></table></div>
    <div style="margin-top:10px;font-size:11px;color:var(--text-dim)">Σ = ${fmtDec(sum,6)} → ∫ ≈ (h/3)×Σ = <b style="color:var(--accent3)">${fmtDec(I,6)}</b></div>`;
  showResult('simp', html);
  addHistory('Simpson 1/3', `[${a},${b}], n=${n}`, `∫ ≈ ${fmtDec(I,6)}`);
}

// ── EULER ────────────────────────────────────────────────────
function solveEuler() {
  clearErr('eu'); clearResult('eu');
  const fxyStr = document.getElementById('eu-fxy').value.trim();
  let x = parseFloat(document.getElementById('eu-x0').value);
  let y = parseFloat(document.getElementById('eu-y0').value);
  const h = parseFloat(document.getElementById('eu-h').value);
  const steps = parseInt(document.getElementById('eu-steps').value);

  if (!fxyStr) { showErr('eu','Masukkan f(x,y)'); return; }
  if (isNaN(x)||isNaN(y)||isNaN(h)||isNaN(steps)) { showErr('eu','Nilai tidak valid'); return; }

  const rows=[{i:0,x,y,fxy:null}];
  for (let i=1;i<=steps;i++) {
    let fxy; try { fxy=evalFn(fxyStr,x,y); } catch(e) { showErr('eu',e.message); return; }
    const yNew=y+h*fxy, xNew=x+h;
    rows.push({i,x:xNew,y:yNew,fxy,xPrev:x,yPrev:y}); x=xNew; y=yNew;
  }

  let html = `<div class="result-header">// HASIL — METODE EULER</div>
    <div class="result-value">y(${fmtDec(x,4)}) ≈ ${fmtDec(y,6)}</div>
    <div style="font-size:11px;color:var(--text-dim)">h=${fmtDec(h,4)} · ${steps} langkah</div>
    <div style="margin-top:14px;font-size:10px;color:var(--text-faint);letter-spacing:1px">// TABEL LANGKAH</div>
    <div style="overflow-x:auto;margin-top:8px"><table class="result-table"><thead><tr>
    <th>n</th><th>xₙ</th><th>yₙ</th><th>f(xₙ,yₙ)</th><th>yₙ₊₁</th></tr></thead><tbody>`;
  rows.forEach(r => {
    if (r.i===0) html += `<tr><td>0</td><td>${fmtDec(r.x,6)}</td><td>${fmtDec(r.y,6)}</td><td>—</td><td>(nilai awal)</td></tr>`;
    else html += `<tr><td>${r.i}</td><td>${fmtDec(r.xPrev,6)}</td><td>${fmtDec(r.yPrev,6)}</td><td>${fmtDec(r.fxy,6)}</td><td style="color:var(--accent3)">${fmtDec(r.y,6)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  showResult('eu', html);
  addHistory('Metode Euler', `y'=${fxyStr.substring(0,30)}`, `y(${fmtDec(x,4)}) ≈ ${fmtDec(y,6)}`);
}

// ── INISIALISASI ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Build awal
  buildMatrix('gj');
  buildMatrix('inv');
  buildMatrix('gs');
  buildLagrangePoints();
  renderHistory();

  // Welcome screen
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'flex';

  // ── Bind semua tombol navigasi dengan SATU event: click
  //    Tidak pakai pointerdown/touchstart bersamaan untuk menghindari dobel-fire

  const mobileMenuBtn    = document.getElementById('mobileMenuBtn');
  const mobileHistoryBtn = document.getElementById('mobileHistoryBtn');
  const mobileMethodBtn  = document.getElementById('mobileMethodBtn');
  const closeSidebarBtn  = document.getElementById('closeSidebar');
  const closeHistoryBtn  = document.getElementById('closeHistory');
  const closeSheetBtn    = document.getElementById('closeMethodSheet');
  const overlay          = document.getElementById('mobileOverlay');

  mobileMenuBtn?.addEventListener('click',    () => openSidebar());
  mobileHistoryBtn?.addEventListener('click', () => openHistory());
  mobileMethodBtn?.addEventListener('click',  () => openMethodSheet());
  closeSidebarBtn?.addEventListener('click',  () => closeAll());
  closeHistoryBtn?.addEventListener('click',  () => closeAll());
  closeSheetBtn?.addEventListener('click',    () => closeAll());
  overlay?.addEventListener('click',          () => closeAll());

  // ── Sidebar: event delegation pada click saja
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.addEventListener('click', function(e) {
      const item = e.target.closest('[data-method]');
      if (!item) return;
      e.preventDefault();
      selectMethod(item.getAttribute('data-method'));
    });
  }

  // ── Bottom sheet: event delegation pada click saja
  const sheet = document.getElementById('mobileMethodSheet');
  if (sheet) {
    sheet.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-method]');
      if (!btn) return;
      e.preventDefault();
      selectMethod(btn.getAttribute('data-method'));
    });
  }

  // Auto-select input saat fokus
  document.addEventListener('focusin', function(e) {
    if (e.target?.tagName === 'INPUT') e.target.select();
  });
});

// ── Ekspor global ─────────────────────────────────────────────
window.showPanel = showPanel;
window.selectMethod = selectMethod;
window.solveGaussJordan = solveGaussJordan;
window.solveInvers = solveInvers;
window.solveGaussSeidel = solveGaussSeidel;
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
