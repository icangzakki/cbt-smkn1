-- Supabase schema untuk CBT SMKN 1 Banjarmasin
-- Gunakan ini di SQL editor Supabase untuk membuat tabel yang benar.

-- 1. TABEL bank_soal
CREATE TABLE IF NOT EXISTS bank_soal (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_mapel   TEXT        NOT NULL,
  jurusan      TEXT[]      NOT NULL DEFAULT '{}',
  kelas        TEXT[]      NOT NULL DEFAULT '{}',
  durasi_menit INTEGER     NOT NULL DEFAULT 90,
  soal         JSONB       NOT NULL DEFAULT '[]',
  dibuat_pada  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL jadwal_ujian
CREATE TABLE IF NOT EXISTS jadwal_ujian (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_soal_id  UUID        NOT NULL REFERENCES bank_soal(id) ON DELETE CASCADE,
  nama_mapel    TEXT        NOT NULL,
  nama_pengajar TEXT        NOT NULL DEFAULT '-',
  jurusan       TEXT[]      NOT NULL DEFAULT '{}',
  kelas         TEXT[]      NOT NULL DEFAULT '{}',
  tanggal       DATE        NOT NULL,
  jam_mulai     TIME        NOT NULL,
  jam_selesai   TIME        NOT NULL,
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL siswa
CREATE TABLE IF NOT EXISTS siswa (
  nis           TEXT        PRIMARY KEY,
  nama          TEXT        NOT NULL,
  jurusan       TEXT        NOT NULL,
  tingkat       TEXT        NOT NULL,
  rombel        TEXT        NOT NULL,
  diupdate_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL hasil_ujian
CREATE TABLE IF NOT EXISTS hasil_ujian (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_id       UUID        NOT NULL REFERENCES jadwal_ujian(id) ON DELETE RESTRICT,
  bank_soal_id    UUID        NOT NULL REFERENCES bank_soal(id) ON DELETE RESTRICT,
  nis             TEXT        NOT NULL,
  siswa_nama      TEXT        NOT NULL,
  jurusan         TEXT        NOT NULL,
  tingkat         TEXT        NOT NULL,
  rombel          TEXT        NOT NULL,
  jawaban         JSONB       NOT NULL DEFAULT '{}',
  skor            INTEGER     NOT NULL DEFAULT 0,
  total_soal      INTEGER     NOT NULL DEFAULT 0,
  is_selesai      BOOLEAN     NOT NULL DEFAULT FALSE,
  waktu_submit    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (jadwal_id, nis)
);

-- 5. INDEX
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_ujian (tanggal);
CREATE INDEX IF NOT EXISTS idx_hasil_nis ON hasil_ujian (nis);
CREATE INDEX IF NOT EXISTS idx_siswa_nis ON siswa (nis);

-- 6. AKTIFKAN RLS
ALTER TABLE bank_soal    ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE hasil_ujian  ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa       ENABLE ROW LEVEL SECURITY;

-- 7. POLICY RLS
-- bank_soal
DROP POLICY IF EXISTS "bank_soal: siapapun bisa baca" ON bank_soal;
CREATE POLICY "bank_soal: siapapun bisa baca" ON bank_soal FOR SELECT USING (true);

DROP POLICY IF EXISTS "bank_soal: guru bisa upload" ON bank_soal;
CREATE POLICY "bank_soal: guru bisa upload" ON bank_soal FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "bank_soal: guru bisa update" ON bank_soal;
CREATE POLICY "bank_soal: guru bisa update" ON bank_soal FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bank_soal: guru bisa hapus" ON bank_soal;
CREATE POLICY "bank_soal: guru bisa hapus" ON bank_soal FOR DELETE USING (true);

-- jadwal_ujian
DROP POLICY IF EXISTS "jadwal_ujian: siapapun bisa baca" ON jadwal_ujian;
CREATE POLICY "jadwal_ujian: siapapun bisa baca" ON jadwal_ujian FOR SELECT USING (true);

DROP POLICY IF EXISTS "jadwal_ujian: admin bisa rilis" ON jadwal_ujian;
CREATE POLICY "jadwal_ujian: admin bisa rilis" ON jadwal_ujian FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "jadwal_ujian: admin bisa update" ON jadwal_ujian;
CREATE POLICY "jadwal_ujian: admin bisa update" ON jadwal_ujian FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "jadwal_ujian: admin bisa hapus" ON jadwal_ujian;
CREATE POLICY "jadwal_ujian: admin bisa hapus" ON jadwal_ujian FOR DELETE USING (true);

-- hasil_ujian
DROP POLICY IF EXISTS "hasil_ujian: siapapun bisa baca" ON hasil_ujian;
CREATE POLICY "hasil_ujian: siapapun bisa baca" ON hasil_ujian FOR SELECT USING (true);

DROP POLICY IF EXISTS "hasil_ujian: siswa bisa submit" ON hasil_ujian;
CREATE POLICY "hasil_ujian: siswa bisa submit" ON hasil_ujian FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "hasil_ujian: sistem bisa update" ON hasil_ujian;
CREATE POLICY "hasil_ujian: sistem bisa update" ON hasil_ujian FOR UPDATE USING (true) WITH CHECK (true);

-- siswa
DROP POLICY IF EXISTS "siswa: siapapun bisa baca" ON siswa;
CREATE POLICY "siswa: siapapun bisa baca" ON siswa FOR SELECT USING (true);

DROP POLICY IF EXISTS "siswa: admin bisa upload" ON siswa;
CREATE POLICY "siswa: admin bisa upload" ON siswa FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "siswa: admin bisa update" ON siswa;
CREATE POLICY "siswa: admin bisa update" ON siswa FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "siswa: admin bisa hapus" ON siswa;
CREATE POLICY "siswa: admin bisa hapus" ON siswa FOR DELETE USING (true);
