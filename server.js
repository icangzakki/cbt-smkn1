const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');

const app = express();
const PORT = 3000;

// Deteksi OS untuk menentukan folder audio default secara otomatis
const isWin = process.platform === 'win32';
let AUDIO_DIR = isWin 
    ? 'D:/BELL_SEKOLAH/audio' 
    : path.join(os.homedir(), 'BellSekolah', 'audio');

const CACHE_FILE = path.join(__dirname, 'jadwal_cache.json');

// Variabel penanda waktu untuk mencegah tabrakan sinkronisasi (stale cache protection)
let lastSavedTime = 0;

// Buat folder audio secara otomatis jika belum ada dengan proteksi fallback jika Drive D tidak ada
try {
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }
} catch (error) {
    if (isWin && AUDIO_DIR.startsWith('D:')) {
        console.log('⚠️ Drive D: tidak ditemukan atau tidak dapat diakses.');
        console.log('🔄 Otomatis mengalihkan folder audio ke C:/BellSekolah/audio...');
        AUDIO_DIR = 'C:/BellSekolah/audio';
        if (!fs.existsSync(AUDIO_DIR)) {
            fs.mkdirSync(AUDIO_DIR, { recursive: true });
        }
    } else {
        console.error('Gagal membuat folder audio:', error.message);
    }
}

app.use(cors());
app.use(express.json());

// 1. Sajikan file audio secara statis agar dapat di-stream oleh browser
app.use('/audio', express.static(AUDIO_DIR));

// 2. Sajikan file frontend secara statis agar terhindar dari isu CORS
const FRONTEND_DIR = __dirname;
app.use('/', express.static(FRONTEND_DIR));

// URL Web App Apps Script Anda yang baru
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxAHs1Y7yKU2V9SvVBu-Avs1uNzqzW9-67iHzmEtAcayR9af2SrBB2uyJA0kxvFy4/exec';

// Rute Diagnostik Pintar untuk / agar jika index.html hilang, sistem memberikan panduan perbaikan yang jelas
app.get('/', (req, res) => {
    const indexPath = path.join(FRONTEND_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <div style="font-family: sans-serif; padding: 40px; background-color: #0f172a; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0;">
                <div style="background-color: #1e293b; padding: 35px; border-radius: 16px; border: 1px solid #f43f5e; max-width: 600px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3);">
                    <h1 style="color: #f43f5e; margin-top: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;">❌ File index.html Tidak Ditemukan</h1>
                    <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5;">Server lokal berjalan sukses, namun tidak dapat menemukan berkas halaman utama dashboard Anda (<code>index.html</code>).</p>
                    <p style="font-size: 15px; color: #cbd5e1;"><strong>Lokasi yang dicari oleh server Anda saat ini:</strong></p>
                    <code style="background-color: #0f172a; padding: 10px 14px; border-radius: 8px; display: block; margin: 10px 0; color: #38bdf8; font-family: monospace; word-break: break-all; border: 1px solid #334155;">${indexPath}</code>
                    <p style="font-size: 15px; color: #cbd5e1; font-weight: bold; margin-top: 20px;">Solusi Perbaikan:</p>
                    <ol style="padding-left: 20px; line-height: 1.6; color: #cbd5e1; font-size: 15px;">
                        <li>Pastikan Anda telah membuat folder bernama <strong style="color: #38bdf8;">frontend</strong> di dalam folder induk <code style="background-color: #0f172a; padding: 2px 6px; border-radius: 4px;">C:\\Bell Sekolah\\</code>.</li>
                        <li>Pastikan berkas <strong style="color: #38bdf8;">index.html</strong> diletakkan di dalam folder <code style="background-color: #0f172a; padding: 2px 6px; border-radius: 4px;">frontend</code> tersebut, bukan di luar atau di dalam <code style="background-color: #0f172a; padding: 2px 6px; border-radius: 4px;">audio_server</code>.</li>
                    </ol>
                    <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
                    <p style="margin-bottom: 0; color: #94a3b8; font-size: 13px; line-height: 1.5; font-family: monospace;">Struktur folder yang benar seharusnya:<br>
                    📁 C:/Bell Sekolah/<br>
                    ├── 📁 frontend/<br>
                    │   └── 📄 index.html  &lt;-- Letakkan berkas HTML di sini<br>
                    └── 📁 audio_server/<br>
                        └── 📄 server.js   &lt;-- Berkas server Node.js
                    </p>
                </div>
            </div>
        `);
    }
});

// Simpan Cache Jadwal Secara Lokal
function saveCache(data) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Gagal menulis cache jadwal:', err);
    }
}

// Ambil Cache Jadwal
function getCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Gagal membaca cache jadwal:', err);
    }
    return [];
}

// Endpoint 1: Mendapatkan daftar file audio lokal
app.get('/api/audio-list', (req, res) => {
    try {
        const files = fs.readdirSync(AUDIO_DIR);
        const audioFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.mp3' || ext === '.wav' || ext === '.ogg';
        });
        res.json({ success: true, data: audioFiles });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memindai folder audio', error: error.message });
    }
});

// Endpoint 2: Proxy mendapatkan jadwal dari Apps Script dengan perlindungan Offline Cache & Caching Prevention
app.get('/api/jadwal', async (req, res) => {
    // PROTEKSI UTAMA: Jika proses simpan lokal (POST) baru terjadi kurang dari 15 detik lalu,
    // langsung sajikan data cache lokal terbaru untuk menghindari 'stale read' (data lama yang muncul lagi) dari Google Server
    const timeSinceLastSave = Date.now() - lastSavedTime;
    if (timeSinceLastSave < 15000) {
        console.log('⚡ Menyajikan cache instan lokal untuk mencegah kembalinya jadwal yang telah dihapus (Stale Read Protection)...');
        return res.json({ success: true, source: 'local_cache', data: getCache() });
    }

    try {
        const response = await axios.get(`${APPS_SCRIPT_URL}?action=getJadwal&t=${Date.now()}`, { timeout: 4000 });
        if (response.data && response.data.success) {
            saveCache(response.data.data);
            return res.json({ success: true, source: 'cloud', data: response.data.data });
        }
        throw new Error('Respons tidak valid dari Cloud');
    } catch (error) {
        console.log('Koneksi internet lambat/offline. Memuat jadwal dari cache lokal...');
        const cachedData = getCache();
        res.json({ success: true, source: 'local_cache', data: cachedData });
    }
});

// Endpoint 3: Menyimpan jadwal baru ke Google Spreadsheet / Lokal
app.post('/api/save-jadwal', async (req, res) => {
    // Kunci waktu penyimpanan aktif detik ini
    lastSavedTime = Date.now();
    saveCache(req.body); // Langsung amankan data terhapus ke cache lokal seketika

    try {
        const response = await axios.post(`${APPS_SCRIPT_URL}?action=saveJadwal`, req.body, { timeout: 6000 });
        if (response.data && response.data.success) {
            return res.json({ success: true, source: 'cloud', message: 'Berhasil menyimpan jadwal ke Spreadsheet!' });
        }
        res.status(500).json({ success: false, message: 'Gagal menyimpan ke Google Sheets' });
    } catch (error) {
        res.json({ 
            success: true, 
            source: 'local_only', 
            message: 'Tersimpan lokal (Offline). Jadwal Anda tetap aktif di PC ini!' 
        });
    }
});

// Endpoint 4: Mencatat Log Bell
app.post('/api/log', async (req, res) => {
    const logData = req.body;
    console.log(`[LOG BELL] [${logData.waktu}] ${logData.kegiatan} - ${logData.audio} (${logData.status})`);
    
    try {
        await axios.post(`${APPS_SCRIPT_URL}?action=logBell`, logData, { timeout: 4000 });
        res.json({ success: true, message: 'Log terkirim ke Cloud' });
    } catch (error) {
        res.json({ success: false, message: 'Offline, log tersimpan di konsol lokal saja' });
    }
});

app.listen(PORT, () => {
    console.log('===================================================');
    console.log(`🔊 SERVER AUDIO BELL SEKOLAH AKTIF (CROSS-PLATFORM)!`);
    console.log(`🔗 Lokal Dashboard: http://localhost:${PORT}`);
    console.log(`📁 Folder Audio: ${AUDIO_DIR}`);
    console.log('===================================================');
});