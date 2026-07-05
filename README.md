# 📘 NumCalc — Materi & Kalkulator Metode Numerik

Dokumentasi ini berisi penjelasan teori, **flowchart**, **cuplikan kode**, serta **contoh soal & pembahasan** untuk setiap metode numerik yang tersedia di kalkulator NumCalc.

## 📂 Struktur Proyek

```
numcalc/
├── index.html        ← Beranda Materi (teori, percabangan metode, SPL, galat, OBE)
├── kalkulator.html    ← Halaman kalkulator interaktif
├── style.css          ← Styling utama (dipakai kedua halaman)
├── materi.css         ← Styling tambahan khusus halaman materi
├── script.js          ← Seluruh logika perhitungan & interaksi kalkulator
└── README.md          ← Dokumentasi ini
```

Buka `index.html` terlebih dahulu untuk membaca materi, lalu klik tombol **"▶ Buka Kalkulator"** di pojok kanan atas untuk masuk ke `kalkulator.html`.

---

## 🧭 Flowchart Umum Aplikasi

```
            ┌───────────────────────┐
            │   index.html dibuka   │
            │   (Beranda Materi)    │
            └───────────┬───────────┘
                        │
            ┌───────────▼───────────┐
            │ Baca teori: Pengertian│
            │ Percabangan, SPL,     │
            │ Galat, OBE            │
            └───────────┬───────────┘
                        │
                klik "Buka Kalkulator"
                        │
            ┌───────────▼───────────┐
            │  kalkulator.html      │
            │  (DOMContentLoaded)   │
            └───────────┬───────────┘
                        │
            ┌───────────▼───────────┐
            │ Pilih metode di sidebar│
            │ → showPanel(id)       │
            └───────────┬───────────┘
                        │
            ┌───────────▼───────────┐
            │ Isi parameter input   │
            └───────────┬───────────┘
                        │
                  klik "▶ HITUNG"
                        │
            ┌───────────▼───────────┐
            │ Validasi input         │
            └─────┬─────────────┬───┘
              tidak valid     valid
                  │               │
        ┌─────────▼───┐   ┌──────▼─────────────┐
        │ showErr()    │   │ Jalankan algoritma  │
        │ tampil pesan │   │ metode terkait      │
        │ error        │   └──────┬──────────────┘
        └──────────────┘          │
                        ┌──────────▼──────────┐
                        │ showResult(): hasil  │
                        │ + tabel cara hitung  │
                        └──────────┬──────────┘
                                  │
                        ┌──────────▼──────────┐
                        │ addHistory(): simpan │
                        │ ke localStorage      │
                        └─────────────────────┘
```

---

## 📘 Penjelasan Lengkap Metode

### 1. Gauss-Jordan

**Tujuan:** Menyelesaikan sistem persamaan linear $Ax = b$ dengan mereduksi matriks augmented $[A|b]$ langsung menjadi bentuk eselon baris tereduksi (Reduced Row Echelon Form / RREF), yaitu matriks identitas di sisi kiri.

**Langkah:**
1. Untuk setiap kolom pivot $k$, lakukan partial pivoting jika perlu (tukar baris agar elemen pivot terbesar secara absolut)
2. Normalisasi baris pivot agar elemen pivot bernilai 1: $\text{baris}_k \leftarrow \dfrac{\text{baris}_k}{a_{kk}}$
3. Eliminasi seluruh elemen di kolom pivot, **baik di atas maupun di bawah** baris pivot: $\text{baris}_i \leftarrow \text{baris}_i - a_{ik} \cdot \text{baris}_k, \quad \text{untuk semua } i \neq k$
4. Ulangi untuk semua kolom — kolom terakhir matriks menjadi solusi $x, y, z$ (atau $x_1, x_2, \dots, x_n$ untuk $n>3$)

#### 🔀 Flowchart

```
        ┌─────────────┐
        │    Start     │
        └──────┬───────┘
               │
        ┌──────▼─────────────────────┐
        │ Input matrix augmented [A|B]│
        │ ordo n×n, nilai koefisien &  │
        │ konstanta                   │
        └──────┬──────────────────────┘
               │
        ┌──────▼────────┐   tidak
        │ Validasi Input ├──────► Input Valid? ──tidak──► ERROR
        └──────┬─────────┘
             (lanjut jika Input Valid? = YA)
               │
        ┌──────▼────────────┐
        │ Inisialisasi pivot: │
        │ i = 0                │
        └──────┬────────────┘
               │
        ┌──────▼──────────────────────┐
   ┌───►│ Cari Elemen Pivot A[i][i]     │
   │    │ Jika nol, tukar baris          │
   │    │ (partial pivot)                │
   │    └──────┬──────────────────────┘
   │           │
   │    ┌──────▼────────────┐  ya
   │    │ Pivot = 0 ?         ├────► No solution
   │    │ (Singular)          │
   │    └──────┬────────────┘
   │         tidak
   │    ┌──────▼──────────────────┐
   │    │ Normalisasi baris pivot   │
   │    │ bagi semua elemen baris i │
   │    │ dengan A[i][i]            │
   │    └──────┬──────────────────┘
   │    ┌──────▼──────────────────────┐
   │    │ Eliminasi kolom i             │
   │    │ A[K] = A[K] − A[K][i]·A[i],   │
   │    │ K ≠ i                          │
   │    └──────┬──────────────────────┘
   │           │
   │    ┌──────▼────────┐   ya, i++
   │    │ i < n − 1 ?     ├──────────────┘
   │    └──────┬────────┘
   │          tidak
   │    ┌──────▼──────────────────┐
   │    │ Baca solusi x[i] dari     │
   │    │ kolom b                   │
   │    └──────┬──────────────────┘
   │           │
   │    ┌──────▼────────┐
   └╌╌╌╌╌╌╌╌╌╌►│    Finish       │
        └────────────────┘
```

> Catatan alur mengikuti diagram: setelah validasi input gagal → `ERROR`; jika pivot bernilai 0 (singular) → `No solution`; jika belum mencapai `i < n−1`, proses kembali ke pencarian pivot kolom berikutnya (`i++`); jika sudah, solusi dibaca dari kolom konstanta lalu `Finish`.

#### 💻 Cuplikan Kode (`script.js`)

```javascript
function solveGaussJordan() {
  const n = parseInt(document.getElementById('gj-n').value);
  const A = getMatrix('gj', n, n + 1);     // ambil matriks augmented [A|b]
  const names = Array.from({length:n}, (_,i) => varName(i,n)); // x,y,z atau x1,x2,...

  for (let k = 0; k < n; k++) {
    // 1) Partial pivoting: cari baris dengan |a[i][k]| terbesar
    let maxIdx = k;
    for (let i = k+1; i < n; i++)
      if (Math.abs(A[i][k]) > Math.abs(A[maxIdx][k])) maxIdx = i;
    if (maxIdx !== k) [A[k], A[maxIdx]] = [A[maxIdx], A[k]];

    if (Math.abs(A[k][k]) < 1e-12) throw new Error('Matriks singular');

    // 2) Normalisasi baris pivot agar elemen pivot = 1
    const piv = A[k][k];
    for (let j = 0; j <= n; j++) A[k][j] /= piv;

    // 3) Eliminasi semua baris lain (atas & bawah pivot)
    for (let i = 0; i < n; i++) {
      if (i !== k) {
        const f = A[i][k];
        for (let j = 0; j <= n; j++) A[i][j] -= f * A[k][j];
      }
    }
  }

  const x = A.map(row => row[n]); // solusi langsung dari kolom terakhir
}
```

#### 📝 Contoh Soal & Pembahasan

**Soal:** Selesaikan sistem persamaan linear berikut menggunakan Gauss-Jordan:

$$2x + y - z = 8$$
$$-3x - y + 2z = -11$$
$$-2x + y + 2z = -3$$

**Pembahasan:**

Matriks augmented awal:
```
[  2   1  -1 |   8 ]
[ -3  -1   2 | -11 ]
[ -2   1   2 |  -3 ]
```

*Langkah k=0:* Pivot terbesar di kolom 0 ada di baris 1 (|-3|), tukar R1↔R2:
```
[ -3  -1   2 | -11 ]
[  2   1  -1 |   8 ]
[ -2   1   2 |  -3 ]
```
Normalisasi R1 (bagi -3):
```
[  1  0.333  -0.667 |  3.667 ]
```
Eliminasi R2 dan R3 pada kolom 0.

*Langkah k=1 dan k=2:* dilakukan dengan pola yang sama (normalisasi pivot, lalu eliminasi dua arah).

**Hasil akhir:** $x = 2,\ y = 3,\ z = -1$

*Verifikasi:* $2(2)+3-(-1) = 4+3+1 = 8$ ✓ ; $-3(2)-3+2(-1) = -6-3-2=-11$ ✓ ; $-2(2)+3+2(-1)=-4+3-2=-3$ ✓

> Coba masukkan soal ini langsung di kalkulator (n=3) untuk melihat seluruh tabel langkah OBE secara rinci.

**Keunggulan:** Solusi langsung terbaca dari kolom terakhir tanpa substitusi mundur; basis untuk mencari invers matriks
**Kelemahan:** Membutuhkan lebih banyak operasi aritmatika dibanding metode yang hanya mereduksi ke bentuk segitiga

---

### 2. Gauss-Seidel

**Tujuan:** Menyelesaikan sistem persamaan linear $Ax = b$ secara **iteratif** — dimulai dari tebakan awal, lalu diperbaiki berulang sampai konvergen. Berbeda dari Gauss-Jordan yang merupakan metode langsung.

**Rumus Iterasi (untuk baris ke-$i$):**
$$x_i^{(k+1)} = \frac{1}{a_{ii}}\left( b_i - \sum_{j<i} a_{ij}x_j^{(k+1)} - \sum_{j>i} a_{ij}x_j^{(k)} \right)$$

Untuk $j<i$ dipakai nilai $x_j$ yang **baru saja** dihitung pada iterasi ke-$(k{+}1)$; untuk $j>i$ masih dipakai nilai lama dari iterasi ke-$k$.

**Syarat konvergensi (cukup):** matriks $A$ dominan diagonal, yaitu $|a_{ii}| > \sum_{j \neq i} |a_{ij}|$ untuk setiap baris.

> ⚠️ **Status:** Metode ini belum tersedia sebagai modul interaktif di kalkulator NumCalc. Bagian ini disediakan sebagai materi tambahan/pembanding.

#### 🔀 Flowchart

```
        ┌─────────────┐
        │   START      │
        └──────┬───────┘
               │
        ┌──────▼────────────────┐
        │ Input: A, b, tebakan   │
        │ awal x⁽⁰⁾, toleransi,  │
        │ maks. iterasi          │
        └──────┬─────────────────┘
               │
        ┌──────▼────────┐
        │ k = 0           │
        └──────┬────────┘
               │
   ┌───────────▼─────────────────┐
   │ Untuk i = 1 .. n:             │
   │  xᵢ⁽ᵏ⁺¹⁾ = (bᵢ − Σⱼ aᵢⱼxⱼ)/aᵢᵢ │
   │  (pakai nilai TERBARU untuk   │
   │   j<i, nilai LAMA untuk j>i)  │
   └───────────┬──────────────────┘
               │
        ┌──────▼─────────────────────┐
        │ Hitung galat = maks         │
        │ |xᵢ⁽ᵏ⁺¹⁾ − xᵢ⁽ᵏ⁾|            │
        └──────┬─────────────────────┘
               │
        ┌──────▼────────────┐   tidak
        │ galat < toleransi  ├──────────┐
        │ atau k = maks iter?│          │
        └──────┬────────────┘          │
              ya                  k = k+1, ulangi
        ┌──────▼────────┐               │
        │ Output x⁽ᵏ⁺¹⁾   │◄─────────────┘
        └──────┬────────┘
        ┌──────▼────────┐
        │   SELESAI       │
        └────────────────┘
```

#### 💻 Cuplikan Kode (Referensi Implementasi JavaScript)

```javascript
function gaussSeidel(A, b, x0, maxIter, tol) {
  const n = b.length;
  let x = [...x0];

  for (let it = 1; it <= maxIter; it++) {
    const xOld = [...x];
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) {
        if (j !== i) sum -= A[i][j] * x[j]; // x[j] sudah ter-update jika j<i
      }
      x[i] = sum / A[i][i];
    }
    const err = Math.max(...x.map((v, i) => Math.abs(v - xOld[i])));
    if (err < tol) break; // konvergen
  }
  return x;
}
```

#### 📝 Contoh Soal & Pembahasan

**Soal:** Selesaikan dengan Gauss-Seidel, tebakan awal $x^{(0)}=(0,0,0)$, toleransi $0.0001$:

$$4x + y + z = 7$$
$$x + 5y + z = -8$$
$$2x + y + 6z = 5$$

*Cek dominan diagonal:* $|4|>|1|+|1|$ ✓, $|5|>|1|+|1|$ ✓, $|6|>|2|+|1|$ ✓ → konvergensi terjamin.

**Tabel iterasi:**

| k | x | y | z | galat |
|---|-----|-----|-----|-------|
| 1 | 1.750000 | -1.950000 | 0.575000 | 1.950000 |
| 2 | 2.093750 | -2.133750 | 0.491042 | 0.343750 |
| 3 | 2.160677 | -2.130344 | 0.468165 | 0.066927 |
| 4 | 2.165545 | -2.126742 | 0.465942 | 0.004868 |
| 5 | 2.165200 | -2.126228 | 0.465971 | 0.000514 |
| 6 | 2.165064 | -2.126207 | 0.466013 | 0.000136 |
| 7 | 2.165049 | -2.126212 | 0.466019 | 0.000016 |

**Hasil:** $x \approx 2.165049,\ y \approx -2.126212,\ z \approx 0.466019$ (konvergen di iterasi ke-7)

*Verifikasi (solusi eksak dengan Gauss-Jordan):* $x=2.165049,\ y=-2.126214,\ z=0.466019$ — cocok ✓

**Keunggulan:** Konvergensi umumnya lebih cepat dari Jacobi karena langsung memakai nilai terbaru; hemat memori untuk sistem besar & sparse
**Kelemahan:** Tidak menjamin konvergen bila matriks tidak dominan diagonal; urutan persamaan memengaruhi kecepatan konvergensi

---

### 3. Invers Matriks

**Tujuan:** Mencari matriks invers $A^{-1}$ sehingga $A \cdot A^{-1} = I$, menggunakan operasi Gauss-Jordan pada matriks augmented $[A|I]$.

**Prinsip Dasar:**
$$[A | I] \xrightarrow{\text{OBE}} [I | A^{-1}]$$

**Syarat:** $A$ harus persegi ($n \times n$) dan $\det(A) \neq 0$.

#### 🔀 Flowchart

```
        ┌─────────────┐
        │    Start     │
        └──────┬───────┘
               │
        ┌──────▼──────────────────────┐
        │ Input matriks A (n×n) dan     │
        │ vektor B                      │
        │ Sistem persamaan Ax = b       │
        └──────┬──────────────────────┘
               │
        ┌──────▼────────────────┐
        │ Validasi: A harus n×n  │
        └──────┬────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Hitung determinan det(A)      │
        │ Ekspansi kofaktor atau         │
        │ metode eliminasi                │
        └──────┬──────────────────────┘
               │
        ┌──────▼────────────┐  ya
        │ det(A) = 0 ?        ├────► Singular, stop
        └──────┬────────────┘
             tidak
        ┌──────▼──────────────────────┐
        │ Hitung matriks kofaktor C      │
        │ C[i][j] = (−1)^(i+j) × M[i][j] │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Hitung matriks adjoin          │
        │ adj(A) = transpose dari C      │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Hitung A⁻¹                     │
        │ A⁻¹ = adj(A) / det(A)          │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Hitung solusi X                │
        │ x = A⁻¹ × b                    │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Tampilkan A⁻¹ dan solusi x     │
        └──────┬──────────────────────┘
               │
        ┌──────▼────────┐
        │    Finish       │
        └────────────────┘
```

> Catatan: diagram konseptual ini menggambarkan pendekatan invers via kofaktor/adjoin ($A^{-1} = \operatorname{adj}(A)/\det(A)$, lalu $x=A^{-1}b$). Implementasi di `script.js` mencapai $A^{-1}$ dengan cara yang secara matematis ekuivalen, yaitu operasi baris elementer (OBE) pada $[A|I] \to [I|A^{-1}]$, karena lebih stabil secara numerik untuk $n$ besar — hasil akhirnya sama.

#### 💻 Cuplikan Kode (`script.js`)

```javascript
function solveInvers() {
  const n = parseInt(document.getElementById('inv-n').value);
  const A = getMatrix('inv', n, n);

  // Bentuk matriks augmented [A | I]
  const M = A.map((row, i) => {
    const id = new Array(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });

  for (let k = 0; k < n; k++) {
    // Partial pivoting
    let maxIdx = k;
    for (let i = k+1; i < n; i++)
      if (Math.abs(M[i][k]) > Math.abs(M[maxIdx][k])) maxIdx = i;
    if (maxIdx !== k) [M[k], M[maxIdx]] = [M[maxIdx], M[k]];
    if (Math.abs(M[k][k]) < 1e-12) throw new Error('Matriks singular');

    // Normalisasi & eliminasi dua arah (identik dengan Gauss-Jordan,
    // tapi diterapkan pada 2n kolom karena matriks identitas ikut diproses)
    const piv = M[k][k];
    for (let j = 0; j < 2*n; j++) M[k][j] /= piv;
    for (let i = 0; i < n; i++) {
      if (i !== k) {
        const f = M[i][k];
        for (let j = 0; j < 2*n; j++) M[i][j] -= f * M[k][j];
      }
    }
  }

  const Ainv = M.map(row => row.slice(n)); // ambil n kolom terakhir = A⁻¹
}
```

#### 📝 Contoh Soal & Pembahasan

**Soal:** Tentukan invers dari $A = \begin{bmatrix} 4 & 3 \\ 6 & 3 \end{bmatrix}$

**Pembahasan:**

Bentuk $[A|I]$:
```
[ 4  3 | 1  0 ]
[ 6  3 | 0  1 ]
```
Normalisasi R1 (bagi 4): `[ 1  0.75 | 0.25  0 ]`
Eliminasi R2: $R2 \leftarrow R2 - 6 \cdot R1$ → `[ 0  -1.5 | -1.5  1 ]`
Normalisasi R2 (bagi -1.5): `[ 0  1 | 1  -0.6667 ]`
Eliminasi R1: $R1 \leftarrow R1 - 0.75 \cdot R2$ → `[ 1  0 | -0.5  0.5 ]`

**Hasil:**
$$A^{-1} = \begin{bmatrix} -0.5 & 0.5 \\ 1 & -0.6667 \end{bmatrix}$$

*Verifikasi:* $A \cdot A^{-1} = \begin{bmatrix}4(-0.5)+3(1) & 4(0.5)+3(-0.6667) \\ 6(-0.5)+3(1) & 6(0.5)+3(-0.6667)\end{bmatrix} = \begin{bmatrix}1 & 0\\0 & 1\end{bmatrix}$ ✓

**Keunggulan:** Sekali $A^{-1}$ ditemukan, bisa dipakai berulang untuk $Ax=b$ dengan $b$ berbeda-beda ($x = A^{-1}b$)
**Kelemahan:** Komputasi $O(n^3)$, lebih mahal dibanding menyelesaikan sistem langsung jika hanya dibutuhkan satu kali solusi

---

### 4. Regula Falsi (Metode Posisi Palsu)

**Tujuan:** Mencari akar persamaan $f(x) = 0$ pada interval $[a, b]$ yang mengurung akar, yaitu $f(a) \cdot f(b) < 0$.

**Rumus Iterasi:**
$$x_r = \frac{a \cdot f(b) - b \cdot f(a)}{f(b) - f(a)}$$

**Langkah:**
1. Pastikan $f(a) \cdot f(b) < 0$
2. Hitung $x_r$ dari rumus interpolasi linear di atas, lalu evaluasi $f(x_r)$
3. Jika $f(a)\cdot f(x_r) < 0$ → akar di $[a,x_r]$, set $b=x_r$. Jika $f(b)\cdot f(x_r)<0$ → akar di $[x_r,b]$, set $a=x_r$
4. Ulangi sampai $|f(x_r)| < \text{toleransi}$ atau iterasi maksimum tercapai

#### 🔀 Flowchart

```
        ┌─────────────┐
        │    Start     │
        └──────┬───────┘
               │
        ┌──────▼──────────────────┐
        │ Input f(x), a, b,          │
        │ toleransi, maks literasi   │
        │ batas bawah a, batas atas b│
        └──────┬────────────────────┘
               │
        ┌──────▼────────────┐  tidak
        │ f(a) × f(b) < 0 ?   ├────► Error
        └──────┬────────────┘
               ya
        ┌──────▼────────────┐
        │ Hitung f(a) dan f(b)│
        └──────┬────────────┘
        ┌──────▼────────────┐
        │ inisialisasi: iter=0│
        └──────┬────────────┘
               │
   ┌───────────▼──────────────────────────┐
   │ hitung titik potong c                   │
   │ c = b − f(b)×(b−a) / (f(b) − f(a))      │
   └───────────┬───────────────────────────┘
               │
        ┌──────▼────────────┐
        │ hitung f(c)         │
        └──────┬────────────┘
               │
        ┌──────▼────────────────────┐  ya
        │ |f(c)| < toleransi          ├────► output c
        │ atau iter > maks ?          │
        └──────┬────────────────────┘
             tidak
        ┌──────▼──────────────────────┐
        │ Update bracket                 │
        │ jika f(a)×f(c) < 0: b = c,     │
        │ else a = c                     │
        └──────┬──────────────────────┘
        ┌──────▼────────────┐
        │ iter = iter + 1     │
        └──────┬────────────┘
               │  (Ulangi ke "hitung titik potong c")
               ▼
        ┌────────────────────────────┐
        │ Tampilkan akar c dan literasi│◄── (dari output c)
        └──────┬─────────────────────┘
        ┌──────▼────────┐
        │    Finish       │
        └────────────────┘
```

#### 💻 Cuplikan Kode (`script.js`)

```javascript
function solveRegulaFalsi() {
  const fxStr = document.getElementById('rf-fx').value.trim(); // mis. "x^3 - x - 2"
  let a = parseFloat(document.getElementById('rf-a').value);
  let b = parseFloat(document.getElementById('rf-b').value);
  const tol = parseFloat(document.getElementById('rf-tol').value);
  const maxIter = parseInt(document.getElementById('rf-iter').value);

  let fa = evalFn(fxStr, a), fb = evalFn(fxStr, b);
  if (fa * fb > 0) throw new Error('Interval tidak mengurung akar');

  let c, fc;
  for (let i = 1; i <= maxIter; i++) {
    c = (a * fb - b * fa) / (fb - fa);   // titik potong interpolasi linear
    fc = evalFn(fxStr, c);
    if (Math.abs(fc) < tol) break;        // konvergen

    if (fa * fc < 0) { b = c; fb = fc; }  // akar di [a, c]
    else              { a = c; fa = fc; } // akar di [c, b]
  }
}
```

> 💡 `evalFn()` memakai parser notasi natural — Anda bisa menulis `x^3 - x - 2` langsung tanpa `Math.pow` atau `**`, dan `2x` otomatis dibaca sebagai `2*x`.

#### 📝 Contoh Soal & Pembahasan

**Soal:** Cari akar $f(x) = x^3 - x - 2$ pada interval $[1, 2]$, toleransi $0.0001$.

*Cek syarat:* $f(1) = 1-1-2=-2$, $f(2)=8-2-2=4$. $f(1)\cdot f(2) = -8 < 0$ ✓ (akar terkurung)

**Tabel iterasi:**

| i | a | b | f(a) | f(b) | x = xᵣ | f(xᵣ) |
|---|---------|---------|----------|---------|----------|----------|
| 1 | 1.000000 | 2.000000 | -2.000000 | 4.000000 | 1.333333 | -0.962963 |
| 2 | 1.333333 | 2.000000 | -0.962963 | 4.000000 | 1.462687 | -0.333339 |
| 3 | 1.462687 | 2.000000 | -0.333339 | 4.000000 | 1.504019 | -0.101818 |
| 4 | 1.504019 | 2.000000 | -0.101818 | 4.000000 | 1.516331 | -0.029895 |
| 5 | 1.516331 | 2.000000 | -0.029895 | 4.000000 | 1.519919 | -0.008675 |
| 6 | 1.519919 | 2.000000 | -0.008675 | 4.000000 | 1.520957 | -0.002509 |
| 7 | 1.520957 | 2.000000 | -0.002509 | 4.000000 | 1.521258 | -0.000725 |
| 8 | 1.521258 | 2.000000 | -0.000725 | 4.000000 | 1.521344 | -0.000209 |
| 9 | 1.521344 | 2.000000 | -0.000209 | 4.000000 | 1.521370 | -0.000060 |

**Hasil:** $x \approx 1.521370$ (konvergen di iterasi ke-9, $|f(x)| < 0.0001$)

> Catatan: pada contoh ini batas $b$ tidak pernah berubah ("macet") karena $f$ melengkung tajam mendekati $b=2$ — ini adalah karakteristik khas Regula Falsi yang disebutkan pada bagian kelemahan di bawah.

**Keunggulan:** Selalu konvergen karena akar selalu terkurung dalam interval, tidak memerlukan turunan fungsi
**Kelemahan:** Bisa konvergen lambat jika salah satu ujung interval "macet" dalam banyak iterasi

---

### 5. Newton-Raphson

**Tujuan:** Mencari akar $f(x)=0$ memakai garis singgung (turunan) — metode terbuka, tidak memerlukan interval kurung.

**Rumus Iterasi:**
$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}$$

**Turunan Rumus:** dari ekspansi Taylor: $f(x_{n+1}) \approx f(x_n) + f'(x_n)(x_{n+1}-x_n) = 0 \Rightarrow x_{n+1}-x_n = -\dfrac{f(x_n)}{f'(x_n)}$

**Syarat:** $f'(x_n) \neq 0$, dan $x_0$ cukup dekat dengan akar. **Laju konvergensi:** kuadratik ($\epsilon_{n+1} \propto \epsilon_n^2$).

#### 🔀 Flowchart

```
        ┌─────────────┐
        │    Start     │
        └──────┬───────┘
               │
        ┌──────▼──────────────────┐
        │ input f(x), f'(x), x0,     │
        │ toleransi, maks iter       │
        │ tebakan awal x0, fungsi    │
        │ dan turunannya              │
        └──────┬────────────────────┘
               │
        ┌──────▼────────────────┐
        │ inisialisasi x: x0,     │
        │ iter = 0                 │
        └──────┬────────────────┘
               │
   ┌───────────▼──────────────────┐
   │ hitung f(x) dan f'(x)           │
   │ evaluasi pada nilai x saat ini  │
   └───────────┬───────────────────┘
               │
        ┌──────▼────────────┐  ya
        │ f'(x) = 0 ?         ├────► gagal, stop
        └──────┬────────────┘
             tidak
   ┌───────────▼──────────────────┐
   │ hitung x baru                   │
   │ x1 = x0 − f(x0)/f'(x0)          │
   └───────────┬───────────────────┘
               │
        ┌──────▼──────────────────────┐  ya
        │ |x1 − x0| < toleransi          ├────► output x1
        │ iter ≥ maks ?                  │
        └──────┬──────────────────────┘
             tidak
        ┌──────▼────────────┐
        │ update: x0 = x1     │
        │ iter = iter + 1      │
        └──────┬────────────┘
               │  (Ulangi ke "hitung f(x) dan f'(x)")
               │
        ┌──────▼──────────────────────┐
        │ tampilkan akar x, dan           │◄── (dari output x1)
        │ jumlah iterasi                  │
        └──────┬──────────────────────┘
        ┌──────▼────────┐
        │    Finish       │
        └────────────────┘
```

#### 💻 Cuplikan Kode (`script.js`)

```javascript
function solveNewtonRaphson() {
  const fxStr  = document.getElementById('nr-fx').value.trim();  // mis. "x^3 - x - 2"
  const dfxStr = document.getElementById('nr-dfx').value.trim(); // mis. "3x^2 - 1"
  let x = parseFloat(document.getElementById('nr-x0').value);
  const tol = parseFloat(document.getElementById('nr-tol').value);
  const maxIter = parseInt(document.getElementById('nr-iter').value);

  for (let i = 1; i <= maxIter; i++) {
    const fx  = evalFn(fxStr, x);
    const dfx = evalFn(dfxStr, x);
    if (Math.abs(dfx) < 1e-12) throw new Error("f'(x) ≈ 0, gagal konvergen");

    const xNew = x - fx / dfx;       // rumus inti Newton-Raphson
    const err = Math.abs(xNew - x);
    x = xNew;
    if (err < tol) break;             // konvergen
  }
}
```

#### 📝 Contoh Soal & Pembahasan

**Soal:** Cari akar $f(x) = x^3 - x - 2$, $f'(x) = 3x^2 - 1$, tebakan awal $x_0 = 1.5$, toleransi $0.0001$.

**Tabel iterasi:**

| n | xₙ | f(xₙ) | f'(xₙ) | xₙ₊₁ | \|Δx\| |
|---|----------|-----------|----------|----------|----------|
| 1 | 1.500000 | -0.125000 | 5.750000 | 1.521739 | 0.021739 |
| 2 | 1.521739 |  0.002137 | 5.947070 | 1.521380 | 0.000359 |
| 3 | 1.521380 |  0.000001 | 5.943790 | 1.521380 | 0.000000 |

**Hasil:** $x \approx 1.521380$ (konvergen hanya dalam **3 iterasi** — bandingkan dengan Regula Falsi yang butuh 9 iterasi untuk soal yang sama, ini menggambarkan laju konvergensi kuadratik Newton-Raphson)

**Keunggulan:** Konvergensi sangat cepat jika tebakan awal baik
**Kelemahan:** Membutuhkan turunan fungsi secara eksplisit dan bisa divergen jika tebakan awal buruk

---

### 6. Interpolasi Lagrange

**Tujuan:** Membangun polinom derajat $n$ yang melalui $n+1$ titik data, tanpa perlu menyelesaikan sistem persamaan untuk mencari koefisiennya.

**Polinom Lagrange:** $P(x) = \sum_{i=0}^{n} y_i \cdot L_i(x)$, dengan basis $L_i(x) = \prod_{j \neq i} \dfrac{x - x_j}{x_i - x_j}$

#### 🔀 Flowchart

```
        ┌─────────────┐
        │    Start     │
        └──────┬───────┘
               │
        ┌──────▼─────────────────────┐
        │ input titik data (x0..xn,     │
        │ y0..yn) dan x target          │
        │ jumlah titik n+1, nilai x       │
        │ untuk di interpolasi           │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────┐  tidak
        │ input valid ?              ├──────► error
        │ (n ≥ 2, xi unik)           │
        └──────┬──────────────────┘
               ya
        ┌──────▼────────┐
        │ inisialisasi:   │
        │ p(x) = 0, i = 0  │
        └──────┬────────┘
               │
   ┌───────────▼──────────────────────┐
   │ hitung Li(x) untuk i saat ini        │
   │ Li(x) = Π (x−xj)/(xi−xj), j≠i        │
   └───────────┬───────────────────────┘
               │
        ┌──────▼────────────────────┐
        │ akumulasi p(x)                │
        │ p(x) = p(x) + yi × Li(x)      │
        └──────┬────────────────────┘
               │
        ┌──────▼────────┐
        │ i = i + 1        │
        └──────┬────────┘
               │
        ┌──────▼────────┐  ya
        │ i ≤ n ?          ├──────┐ (Ulangi ke "hitung Li(x)")
        └──────┬────────┘        │
             tidak                │
        ┌──────▼──────────────────────┐
        │ tampilkan hasil p(x)            │
        │ nilai interpolasi di titik       │
        │ x target                         │
        └──────┬──────────────────────┘
        ┌──────▼────────┐
        │    Finish       │
        └────────────────┘
```

#### 💻 Cuplikan Kode (`script.js`)

```javascript
function solveLagrange() {
  const xs = [...], ys = [...]; // titik-titik data dari input
  const xt = parseFloat(document.getElementById('lag-xt').value); // x taksir

  let Px = 0;
  for (let i = 0; i < n; i++) {
    let Li = 1;
    for (let j = 0; j < n; j++) {
      if (i !== j) Li *= (xt - xs[j]) / (xs[i] - xs[j]); // basis Lagrange Lᵢ(x)
    }
    Px += Li * ys[i];
  }
}
```

#### 📝 Contoh Soal & Pembahasan

**Soal:** Diketahui titik $(1,1), (2,4), (3,9), (4,16)$ (yaitu $y=x^2$). Taksir nilai $y$ pada $x=2.5$.

**Pembahasan:**
$$L_0(2.5)=\frac{(2.5-2)(2.5-3)(2.5-4)}{(1-2)(1-3)(1-4)} = \frac{(-0.5)(-1.5)\cdot(-1.5)}{(-6)} ,\ \dots$$

(dihitung untuk $L_0,L_1,L_2,L_3$, lalu dijumlahkan sesuai $y_i$)

**Hasil:** $P(2.5) = 6.25$

*Verifikasi:* karena data berasal dari $y=x^2$, nilai eksaknya adalah $2.5^2 = 6.25$ — cocok persis ✓ (karena Lagrange derajat 3 mampu merekonstruksi polinom kuadrat secara eksak)

**Keunggulan:** Tidak perlu menyelesaikan sistem persamaan untuk mencari koefisien polinom
**Kelemahan:** Komputasi berat untuk $n$ besar, $O(n^2)$

---

### 7. Simpson 1/3 (Komposit)

**Tujuan:** Menghampiri nilai integral $\int_a^b f(x)\,dx$ dengan membagi area menjadi pias-pias parabola.

**Rumus Komposit:**
$$\int_a^b f(x)\,dx \approx \frac{h}{3}\left[f(x_0) + 4\sum_{\text{ganjil}} f(x_i) + 2\sum_{\text{genap}} f(x_i) + f(x_n)\right]$$

dengan $h = \dfrac{b-a}{n}$, $n$ harus **genap**, $x_i = a+i\cdot h$.

**Estimasi Galat:** $E \approx -\dfrac{(b-a)\,h^4}{180} f^{(4)}(\xi)$ — eksak untuk polinom berderajat $\leq 3$.

#### 🔀 Flowchart

```
        ┌─────────────┐
        │    Start     │
        └──────┬───────┘
               │
        ┌──────▼──────────────────┐
        │ input f(x) batas a,b,n     │
        │ n = jumlah subinterval     │
        └──────┬────────────────────┘
               │
        ┌──────▼────────────────┐  tidak
        │ n genap dan a<b ?        ├──────► Error
        └──────┬────────────────┘
               ya
   ┌───────────▼──────────────────┐
   │ hitung h (lebar subinterval)     │
   │ h = (b − a) / n                  │
   └───────────┬───────────────────┘
               │
        ┌──────▼────────────────────┐
        │ inisialisasi sum = f(a)+f(b) │
        │ i = 1, koefisien ujung = 1   │
        └──────┬────────────────────┘
               │
   ┌───────────▼──────────────────┐
   │ hitung xi = a + i × h, hitung   │
◄──┤ f(xi)                            │
   └───────────┬───────────────────┘
               │
        ┌──────▼────────┐  ya
        │ i ganjil ?       ├────► sum += 4f(xi) ──┐
        └──────┬────────┘                          │
             tidak                                  │
        ┌──────▼────────┐                          │
        │ sum += 2f(xi)   ├──────────────────────┐  │
        └────────────────┘                       │  │
                                          ┌───────▼──▼─┐
                                          │  i = i + 1  │
                                          └──────┬──────┘
                                                 │
                                          ┌──────▼────────┐  ya
                                          │ i < n ?         ├────► (Ulangi ke "hitung xi")
                                          └──────┬────────┘
                                                tidak
                                          ┌──────▼──────────────┐
                                          │ Hitung integral        │
                                          │ I = (h/3) × sum        │
                                          └──────┬──────────────┘
                                          ┌──────▼────────┐
                                          │    Finish       │
                                          └────────────────┘
```

#### 💻 Cuplikan Kode (`script.js`)

```javascript
function solveSimpson() {
  const fxStr = document.getElementById('simp-fx').value.trim(); // mis. "x^2 + 2x + 1"
  const a = parseFloat(document.getElementById('simp-a').value);
  const b = parseFloat(document.getElementById('simp-b').value);
  let n = parseInt(document.getElementById('simp-n').value);
  if (n % 2 !== 0) n++; // paksa genap

  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = a + i * h;
    const fx = evalFn(fxStr, x);
    let coef;
    if (i === 0 || i === n) coef = 1;       // titik ujung
    else if (i % 2 === 0)   coef = 2;       // titik genap (batas antar-pias)
    else                    coef = 4;       // titik ganjil (tengah pias)
    sum += coef * fx;
  }
  const I = (h / 3) * sum;

  // Estimasi galat: turunan ke-4 didekati secara numerik (central difference)
  // di titik tengah interval, lalu dimasukkan ke rumus galat baku Simpson.
  const mid = (a + b) / 2;
  const hd = Math.max(h, 1e-3);
  const f4mid = (f(mid-2*hd) - 4*f(mid-hd) + 6*f(mid) - 4*f(mid+hd) + f(mid+2*hd)) / hd**4;
  const errEst = -((b - a) * h**4 / 180) * f4mid;
}
```

#### 📝 Contoh Soal & Pembahasan

**Soal:** Hitung $\displaystyle\int_0^4 x^2\,dx$ dengan Simpson 1/3, $n=8$.

*Nilai eksak* (dihitung analitik): $\int_0^4 x^2\,dx = \left[\frac{x^3}{3}\right]_0^4 = \frac{64}{3} = 21.3333...$

$h = (4-0)/8 = 0.5$

**Tabel titik:**

| i | xᵢ | f(xᵢ)=xᵢ² | Koefisien | Koef × f(xᵢ) |
|---|-----|---------|-----------|--------------|
| 0 | 0.0 | 0.00 | 1 (ujung) | 0.00 |
| 1 | 0.5 | 0.25 | 4 (ganjil) | 1.00 |
| 2 | 1.0 | 1.00 | 2 (genap) | 2.00 |
| 3 | 1.5 | 2.25 | 4 (ganjil) | 9.00 |
| 4 | 2.0 | 4.00 | 2 (genap) | 8.00 |
| 5 | 2.5 | 6.25 | 4 (ganjil) | 25.00 |
| 6 | 3.0 | 9.00 | 2 (genap) | 18.00 |
| 7 | 3.5 | 12.25 | 4 (ganjil) | 49.00 |
| 8 | 4.0 | 16.00 | 1 (ujung) | 16.00 |

$\Sigma(\text{koef}\times f(x_i)) = 0+1+2+9+8+25+18+49+16 = 128$

$$I \approx \frac{h}{3}\times \Sigma = \frac{0.5}{3}\times 128 = 21.3333$$

**Hasil:** $\int_0^4 x^2\,dx \approx 21.3333$ — **sama persis dengan nilai eksak**, karena $f(x)=x^2$ berderajat 2 (≤3) sehingga Simpson 1/3 menghitungnya secara eksak (galat $\approx 0$, sesuai sifat $f^{(4)}(x)=0$ untuk polinom berderajat $\leq 3$).

**Keunggulan:** Akurasi tinggi untuk fungsi halus dengan jumlah subinterval relatif sedikit
**Kelemahan:** Mengharuskan $n$ genap; akurasi menurun untuk fungsi dengan perubahan tajam (butuh $n$ besar)

---

### 8. Metode Euler

**Tujuan:** Menyelesaikan persamaan diferensial biasa $\dfrac{dy}{dx}=f(x,y)$ dengan kondisi awal $y(x_0)=y_0$, secara numerik.

**Skema Iterasi:**
$$y_{n+1} = y_n + h \cdot f(x_n, y_n)$$

**Parameter:** $h$ = step size, $x_{n+1}=x_n+h$. **Orde galat:** lokal $O(h^2)$, global $O(h)$ (metode orde-1).

#### 🔀 Flowchart

```
        ┌─────────────┐
        │    START     │
        └──────┬───────┘
               │
        ┌──────▼──────────────────┐
        │ input f(t,y), t0, y=y0     │
        │ kondisi awal, rentang,     │
        │ ukuran langkah              │
        └──────┬────────────────────┘
               │
        ┌──────▼──────────────────┐  tidak
        │ input valid ?              ├──────► Error
        │ (h>0, t_akhir > t0)       │
        └──────┬──────────────────┘
               ya
        ┌──────▼──────────────────────┐
        │ Inisialisasi: t = t0, y = y0   │
        │ Simpan pasangan (t,y) ke        │
        │ tabel hasil                     │
        └──────┬──────────────────────┘
               │
   ┌───────────▼──────────────────┐
   │ Hitung slope (kemiringan)         │
◄──┤ k = f(t,y)                        │
   └───────────┬───────────────────┘
               │
        ┌──────▼──────────────────┐
        │ update y (nilai fungsi)    │
        │ y = y + h × k                │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ update t (waktu/variabel bebas)│
        │ t = t + h                       │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────┐
        │ simpan pasangan (t,y)      │
        │ ke tabel                    │
        └──────┬──────────────────┘
               │
        ┌──────▼────────┐  ya
        │ t < t_akhir ?    ├────► (Ulangi ke "Hitung slope")
        └──────┬────────┘
             tidak
        ┌──────▼──────────────────────┐
        │ Tampilkan tabel dan grafik      │
        │ solusi y(t)                     │
        └──────┬──────────────────────┘
        ┌──────▼────────┐
        │    SELESAI      │
        └────────────────┘
```

#### 💻 Cuplikan Kode (`script.js`)

```javascript
function solveEuler() {
  const fxyStr = document.getElementById('eu-fxy').value.trim(); // mis. "x + y"
  let x = parseFloat(document.getElementById('eu-x0').value);
  let y = parseFloat(document.getElementById('eu-y0').value);
  const h = parseFloat(document.getElementById('eu-h').value);
  const steps = parseInt(document.getElementById('eu-steps').value);

  for (let i = 1; i <= steps; i++) {
    const fxy = evalFn(fxyStr, x, y);  // hitung f(xₙ, yₙ)
    const yNew = y + h * fxy;           // skema iterasi Euler
    const xNew = x + h;
    x = xNew; y = yNew;
  }
}
```

#### 📝 Contoh Soal & Pembahasan

**Soal:** Selesaikan $y' = x+y$, $y(0)=1$, $h=0.1$, sebanyak 10 langkah.

**Tabel langkah:**

| n | xₙ | yₙ | f(xₙ,yₙ) | yₙ₊₁ = yₙ + h·f |
|---|------|----------|----------|------------------|
| 0 | 0.0 | 1.000000 | — | (nilai awal) |
| 1 | 0.0 | 1.000000 | 1.000000 | 1.100000 |
| 2 | 0.1 | 1.100000 | 1.200000 | 1.220000 |
| 3 | 0.2 | 1.220000 | 1.420000 | 1.362000 |
| 4 | 0.3 | 1.362000 | 1.662000 | 1.528200 |
| 5 | 0.4 | 1.528200 | 1.928200 | 1.721020 |
| 6 | 0.5 | 1.721020 | 2.221020 | 1.943122 |
| 7 | 0.6 | 1.943122 | 2.543122 | 2.197434 |
| 8 | 0.7 | 2.197434 | 2.897434 | 2.487178 |
| 9 | 0.8 | 2.487178 | 3.287178 | 2.815895 |
| 10 | 0.9 | 2.815895 | 3.715895 | 3.187485 |

**Hasil:** $y(1.0) \approx 3.187485$

*Pembanding:* solusi eksak PDB ini adalah $y=2e^x-x-1$, sehingga $y(1)=2e-2\approx 3.436564$. Selisihnya ($\approx0.249$) menggambarkan galat global $O(h)$ — jika $h$ diperkecil (mis. $h=0.01$), hasil akan jauh lebih mendekati nilai eksak.

**Keunggulan:** Sederhana dan mudah diimplementasikan
**Kelemahan:** Membutuhkan step size kecil untuk akurasi yang baik

---

## 🚀 Cara Menjalankan

### Prasyarat
- Browser modern (Chrome, Firefox, Edge, Safari)
- Koneksi internet (untuk Google Fonts)

### Langkah
1. Simpan kelima file (`index.html`, `kalkulator.html`, `style.css`, `materi.css`, `script.js`) dalam folder yang sama
2. Buka `index.html` di browser untuk membaca materi
3. Klik **"▶ Buka Kalkulator"** di pojok kanan atas untuk masuk ke `kalkulator.html`
4. Pilih metode dari sidebar kiri
5. Masukkan parameter (klik pada kolom angka akan otomatis menyeleksi nilainya, sehingga bisa langsung diketik ulang tanpa perlu menghapus manual)
6. Klik **▶ HITUNG**
7. Lihat hasil, tabel cara perhitungan langkah-demi-langkah, dan histori di panel kanan

### Navigasi Mobile
- Pada layar < 900px, sidebar dan histori panel akan tersembunyi
- Gunakan tombol **☰** di header kiri untuk membuka menu metode
- Gunakan tombol **📋** di header kanan untuk membuka histori

### Notasi Matematika yang Didukung
Pada kolom f(x), f'(x), dan f(x,y), Anda dapat menulis ekspresi secara natural:
- **Pangkat:** gunakan `^`, mis. `x^2`, `x^3 - x - 2`
- **Perkalian implisit:** `2x` (= `2*x`), `3(x+1)` (= `3*(x+1)`), `x(x-1)` (= `x*(x-1)`)
- **Fungsi trigonometri & lainnya:** `sin(x)`, `cos(x)`, `tan(x)`, `sqrt(x)`, `exp(x)`, `ln(x)`, `abs(x)`, dll
- **Konstanta:** `pi`, `e`

---

## 💾 Sistem Histori

### Fitur
-  Menyimpan hingga 50 perhitungan terakhir
-  Tersimpan di `localStorage` (tidak hilang setelah refresh)
-  Menampilkan metode, parameter, hasil, dan timestamp
-  Dapat menghapus satu atau semua histori
