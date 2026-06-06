# Deploy Static Frontend

Repo ini sekarang disusun ulang untuk deployment statis pada Vercel atau Netlify.

## Struktur

- `index.html` — halaman frontend utama yang dapat langsung di-deploy.
- `server.js` — kode server Node.js lama yang tidak digunakan oleh hosting statis.
- `netlify.toml` — konfigurasi Netlify untuk mempublikasikan root dan mendukung SPA.
- `vercel.json` — konfigurasi Vercel untuk menyajikan `index.html` sebagai static site.

## Cara deploy

### Vercel
1. Login ke Vercel.
2. Pilih impor project dari Git.
3. Pilih repository ini.
4. Pilih framework "Other" atau "Static Site".
5. Pastikan `Output Directory` kosong atau `.`.
6. Deploy.

### Netlify
1. Login ke Netlify.
2. Pilih "New site from Git".
3. Pilih repository ini.
4. Atur build command kosong.
5. Set publish directory ke `.`.
6. Deploy.

## Catatan

- `server.js` tidak dapat digunakan langsung pada hosting statis seperti Vercel/Netlify karena tergantung pada folder lokal audio dan akses filesystem.
- Jika Anda ingin tetap menggunakan backend, jalankan `server.js` secara lokal di mesin sendiri, atau pisahkan backend ke environment server yang mendukung Node.

## Halaman Siswa

- `siswa.html` adalah halaman ujian siswa terpisah.
- Siswa hanya perlu memasukkan NIS.
- Setelah NIS ditemukan, halaman menampilkan nama, jurusan, dan kelas.
- Setelah siswa mengonfirmasi data, sistem menampilkan kartu jadwal ujian:
  - nama mapel
  - guru pengajar
  - tanggal ujian
  - jam soal aktif
  - jam soal nonaktif
  - hitung mundur sampai jadwal dimulai
  - tombol "Mulai Ujian" hanya aktif ketika jadwal sudah tiba
- Data siswa diambil dari tabel `siswa` menggunakan endpoint serverless.
- Soal diambil dari tabel `bank_soal`, jadwal dari tabel `jadwal_ujian`, dan hasil disimpan ke tabel `hasil_ujian`.

## Backend Serverless

- `api/submit-exam.js` adalah fungsi serverless Vercel yang memproses pengiriman jawaban siswa.
- `api/student-profile.js` adalah fungsi serverless Vercel yang mencari profil siswa berdasarkan NIS dan memuat jadwal ujian.
- Fungsi ini menggunakan Supabase Service Role Key untuk mengambil data yang sensitif.
- Pastikan Supabase memiliki tabel `siswa` yang berisi:
  - `nis`, `nama`, `jurusan`, `tingkat`, `rombel`
- Pastikan Supabase memiliki tabel `hasil_ujian` yang berisi:
  - `jadwal_id`, `bank_soal_id`, `nis`, `siswa_nama`, `jurusan`, `tingkat`, `rombel`
  - `jawaban` (jsonb), `skor`, `total_soal`
  - `is_selesai`, `waktu_submit`
- Jalankan di Vercel dengan environment variable berikut:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Konfigurasi Vercel

- `vercel.json` sudah disiapkan untuk menyajikan `index.html`, `siswa.html`, dan API serverless.
- Halaman siswa dapat diakses melalui `/siswa`.

## Skala 1000 Siswa

Untuk menjalankan aplikasi ini dengan 1000 siswa secara lancar, perhatikan hal berikut:

- Pastikan Supabase memiliki rencana dan batas kueri yang sesuai. Paket gratis/entry-level bisa dibatasi oleh quota dan rate limit.
- Pisahkan antarmuka admin dari antarmuka siswa. Aplikasi ini saat ini adalah panel admin; kebutuhan siswa ulangan memerlukan halaman ujian terpisah.
- Pusatkan logika sensitif pada backend atau serverless function, bukan langsung di frontend yang menggunakan anon key.
- Gunakan RLS (Row Level Security) di Supabase agar data siswa tetap aman dan akses ditentukan dengan ketat.
- Tambahkan indeks pada tabel `bank_soal` dan `jadwal_ujian` di Supabase agar pencarian dan fetching data tetap cepat.
- Untuk load tinggi, batasi kueri yang mengembalikan banyak baris; reload daftar bank soal menggunakan `limit` atau pagination.
