# TODO — Revisi Logika Kalkulator Metode Numerik

## Rencana utama (sesuai catatan user)

1. **Regula Falsi**
   - Perbaiki kriteria berhenti agar konsisten: berhenti ketika **|f(c)| < tolF** atau **|c - cPrev| < tolX**.
   - Hapus ketergantungan pada `f(c)===0`.
   - Pastikan nilai `c` dan `f(c)` yang memicu berhenti tampil di hasil/tabel.

2. **Newton-Raphson**
   - Pastikan kriteria berhenti berbasis galat/toleransi: **|f(x)| < tolF** atau **|x_{n+1}-x_n| < tolX**.
   - Maks iterasi hanya jadi batas pengaman.
   - Tetap tampilkan langkah per iterasi (f(x), f'(x), update x) dan galat.

3. **Interpolasi Lagrange**
   - Ubah input agar untuk kasus derajat 2 (3 titik) menggunakan **f(x)**: tampilkan bahwa
     **y0,y1,y2 = f(x0), f(x1), f(x2)** (bukan input y mentah).
   - Sesuaikan tampilan/label/rincian langkah sehingga user paham proses pembentukan ln/bentuk f(x) dulu.

4. **Simpson 1/3**
   - Tambahkan input **integral analitik/eksak** agar bisa menghitung:
     - **I_analitik = ∫_a^b f(x) dx** (berdasarkan ekspresi/rumus analitik yang diinput).
     - **E = |I_tebakan - I_analitik|** dan (opsional) E_rel.
   - Rapikan penjelasan koefisien jadi pola **1-4-2-4-...-2-4-1** dan tampilkan tabel `x0..xn` yang koheren.
   - Perjelas “4-2-4-2” pada bagian penjabaran i.

5. **Metode Euler**
   - Perbaiki logika jumlah langkah dan interval agar benar untuk kasus seperti **interval 0–10**.
   - Tambahkan input **solusi analitik y(x)** sehingga bisa menghitung:
     - **E = |y_tebakan - y_analitik|**.
   - Tampilkan proses substitusi galat di hasil akhir.

## Implementasi
6. Modifikasi `index.html`
   - Tambahkan field input yang dibutuhkan untuk Simpson (I_analitik) dan Euler (y_analitik).
   - Sesuaikan field input Lagrange (opsi derajat 2 pakai f(x)).

7. Modifikasi `script.js`
   - Implementasi revisi logika di masing-masing fungsi `solveRegulaFalsi`, `solveNewtonRaphson`, `solveLagrange`, `solveSimpson`, `solveEuler`.

## Testing
8. Manual test via browser (kalkulator.html)
   - Gunakan default contoh (atau input yang sesuai) untuk tiap metode.
   - Pastikan tabel/hasil cocok dengan toleransi & galat yang diminta.

