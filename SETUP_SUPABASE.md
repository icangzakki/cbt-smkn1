# Setup Supabase untuk CBT SMKN 1 Banjarmasin

## Langkah 1: Buat Project Supabase

1. Login ke [supabase.com](https://supabase.com)
2. Klik **"New Project"**
3. Isi nama project: `cbt-smkn1-banjarmasin`
4. Pilih region terdekat (misal: Singapore)
5. Tunggu project selesai dibuat (~2 menit)
6. Salin **Project URL** dan **Anon Key** untuk nanti

## Langkah 2: Jalankan Schema SQL

1. Di project Supabase, buka tab **"SQL Editor"**
2. Klik **"New Query"**
3. Copy-paste seluruh isi file `supabase-schema.sql` ke editor
4. Klik **"Run"** dan tunggu selesai (akan ada notifikasi sukses)

## Langkah 3: Verifikasi Tabel

Buka **"Table Editor"** di sidebar, pastikan ada tabel:
- ✅ `bank_soal` (dengan kolom: id, nama_mapel, durasi_menit, soal, jurusan, kelas, dibuat_pada)
- ✅ `jadwal_ujian` (dengan kolom: id, bank_soal_id, nama_mapel, nama_pengajar, etc)
- ✅ `siswa` (dengan kolom: nis, nama, jurusan, tingkat, rombel)
- ✅ `hasil_ujian` (dengan kolom: id, jadwal_id, bank_soal_id, nis, jawaban, skor, etc)

## Langkah 4: Aktifkan RLS (Row Level Security)

1. Buka setiap tabel satu per satu
2. Klik icon **🔒 RLS** di pojok kanan atas
3. Klik **"Enable"**
4. Seharusnya sudah ada policy dari schema (jika belum, jalankan ulang schema)

## Langkah 5: Cek RLS Policy

Untuk setiap tabel, lihat Policies:
- `bank_soal`: Policy `"bank_soal: siapapun bisa baca"` dan `"bank_soal: guru bisa upload"`
- `siswa`: Policy untuk SELECT  
- `jadwal_ujian`: Policy untuk SELECT dan INSERT
- `hasil_ujian`: Policy untuk SELECT, INSERT, UPDATE

Jika belum ada atau error, jalankan ulang schema SQL.

## Langkah 6: Generate API Key

1. Di Supabase project, buka **Settings** → **API**
2. Cari bagian **"Project API keys"**
3. Salin **`anon` / `public` key** (untuk frontend)
4. Salin **`service_role` key** (untuk backend serverless, jangan expose!)

## Langkah 7: Update Konfigurasi di Frontend

Update file `admin.html` dan `index.html` dengan Project URL dan Anon Key yang sudah dicatat:

### Di `admin.html` (baris ~193-195):
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // Ganti YOUR_PROJECT_ID
const SUPABASE_KEY = 'YOUR_ANON_KEY';  // Ganti dengan anon key
```

### Di `index.html` (baris ~247-249):
```javascript
const sbUrl = 'https://YOUR_PROJECT_ID.supabase.co';  // Ganti YOUR_PROJECT_ID
const sbKey = 'YOUR_ANON_KEY';  // Ganti dengan anon key
```

## Langkah 8: Setup Environment Variables untuk API Serverless

Jika akan deploy ke Vercel dengan serverless functions, buat `.env.local`:

```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Langkah 9: Test Upload Excel

1. Buka browser: `http://localhost:3000/admin.html` (atau langsung ke `/admin` jika deploy)
2. Di panel **"1. Upload Bank Soal"**:
   - Isi **Mata Pelajaran**: misalnya "Matematika"
   - Isi **Durasi Ujian**: 90 (menit)
   - Pilih file Excel dengan format: `soal | A | B | C | D | jawaban`
   - Klik **"Simpan ke Database Soal"**
3. Seharusnya muncul modal hijau "Sukses" dan data terbaca

## Langkah 10: Test Halaman Siswa

1. Buka: `http://localhost:3000/` (atau `/index.html`)
2. Input NIS siswa
3. Klik "Cek Data Siswa"
4. Seharusnya data siswa muncul (jika sudah ada di tabel `siswa`)

## Troubleshooting

### Error: "Database Error" saat upload
- Pastikan tabel `bank_soal` sudah dibuat
- Pastikan RLS policy sudah diaktifkan
- Cek konsol browser (F12 → Console) untuk error detail

### Error: "NIS tidak terdaftar"
- Pastikan tabel `siswa` sudah ada data
- Pastikan kolom: `nis`, `nama`, `jurusan`, `tingkat`, `rombel`

### Excel tidak terbaca
- Pastikan header Excel: **soal | A | B | C | D | jawaban** (case-insensitive)
- Format: `.xlsx` atau `.csv`
- Jangan ada baris kosong di data

### Row Level Security Error
- Buka SQL Editor di Supabase
- Jalankan ulang schema untuk ensure semua policy aktif

## Format Excel yang Benar

| soal | A | B | C | D | jawaban |
|------|---|---|---|---|---------|
| Berapa hasil 2+2? | 3 | 4 | 5 | 6 | B |
| Ibu kota Indonesia? | Jakarta | Surabaya | Bandung | Medan | A |

**Header harus persis seperti ini (case-insensitive)**
