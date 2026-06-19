const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Mengatur batas limit agar data base64 gambar yang besar dapat diunggah dengan lancar
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Melayani file statis dari folder frontend
app.use(express.static(path.join(__dirname, '../frontend')));

let pool;

// Inisialisasi Database Otomatis
async function initDatabase() {
  try {
    // 1. Koneksi awal ke MySQL tanpa database untuk membuat database jika belum ada
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    const dbName = process.env.DB_NAME || 'profile_cms';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();
    console.log(`Database '${dbName}' dipastikan aktif.`);

    // 2. Buat Connection Pool ke database yang dituju
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 3. Buat tabel users jika belum ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Buat tabel articles jika belum ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`articles\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`judul\` VARCHAR(255) NOT NULL,
        \`isi\` TEXT NOT NULL,
        \`gambar\` LONGTEXT,
        \`tanggal\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Seeding admin default jika tabel users masih kosong
    const [users] = await pool.query('SELECT * FROM users LIMIT 1');
    if (users.length === 0) {
      await pool.query("INSERT INTO users (username, password) VALUES ('admin', 'password123')");
      console.log('Default admin seeded: admin / password123');
    }

    // 6. Seeding artikel contoh jika tabel articles masih kosong
    const [articles] = await pool.query('SELECT * FROM articles LIMIT 1');
    if (articles.length === 0) {
      await pool.query(`
        INSERT INTO articles (judul, isi, gambar, tanggal) VALUES 
        (
          'Belajar Dasar Web Development', 
          'Web development adalah proses membangun dan memelihara situs web. Ini adalah pekerjaan di balik layar yang membuat situs web terlihat hebat, bekerja dengan cepat, dan berkinerja baik dengan pengalaman pengguna yang mulus. Dalam artikel ini, kita akan mempelajari dasar-dasar HTML, CSS, dan JavaScript sebagai pilar utama pembuatan website modern.', 
          '', 
          '30/05/2026'
        ),
        (
          'Pentingnya UI/UX di Era Digital', 
          'UI (User Interface) dan UX (User Experience) adalah dua elemen krusial dalam pembuatan produk digital. UI berfokus pada keindahan tampilan visual, sedangkan UX berfokus pada kenyamanan pengguna saat berinteraksi dengan produk tersebut. Kombinasi yang baik antara UI yang indah dan UX yang intuitif akan meningkatkan konversi serta kepuasan pengguna secara signifikan.', 
          '', 
          '29/05/2026'
        )
      `);
      console.log('Contoh artikel awal berhasil ditambahkan (seeded).');
    }

    console.log('Database & Tabel MySQL siap digunakan.');
  } catch (error) {
    console.error('ERROR saat inisialisasi database:', error.message);
    console.log('Pastikan MySQL Server (seperti XAMPP) sudah dijalankan!');
  }
}

// Jalankan Inisialisasi Database
initDatabase();

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Endpoint Login Admin
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password harus diisi!' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      res.json({ success: true, message: 'Login berhasil!' });
    } else {
      res.status(401).json({ success: false, message: 'Username atau password salah!' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server' });
  }
});

// 2. Endpoint Get All Articles (Read)
app.get('/api/articles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articles ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data artikel dari database' });
  }
});

// 3. Endpoint Get Article By ID (Read Single)
app.get('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM articles WHERE id = ?', [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data artikel' });
  }
});

// 4. Endpoint Create Article (Create)
app.post('/api/articles', async (req, res) => {
  const { judul, isi, gambar, tanggal } = req.body;
  if (!judul || !isi) {
    return res.status(400).json({ success: false, message: 'Judul dan konten tidak boleh kosong' });
  }

  try {
    const tgl = tanggal || new Date().toLocaleDateString('id-ID');
    const [result] = await pool.query(
      'INSERT INTO articles (judul, isi, gambar, tanggal) VALUES (?, ?, ?, ?)',
      [judul, isi, gambar || '', tgl]
    );
    res.status(201).json({ success: true, message: 'Artikel berhasil ditambahkan ke database', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan artikel ke database' });
  }
});

// 5. Endpoint Update Article (Update)
app.put('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const { judul, isi, gambar, tanggal } = req.body;

  if (!judul || !isi) {
    return res.status(400).json({ success: false, message: 'Judul dan konten tidak boleh kosong' });
  }

  try {
    let query = 'UPDATE articles SET judul = ?, isi = ?, tanggal = ?';
    let params = [judul, isi, tanggal || new Date().toLocaleDateString('id-ID')];

    // Jika gambar dikirim, kita update. Jika tidak dikirim atau null, kita tetap pertahankan gambar lama.
    if (gambar !== undefined) {
      query += ', gambar = ?';
      params.push(gambar);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Artikel berhasil diperbarui di database' });
    } else {
      res.status(404).json({ success: false, message: 'Artikel tidak ditemukan di database' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui artikel di database' });
  }
});

// 6. Endpoint Delete Article (Delete)
app.delete('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM articles WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Artikel berhasil dihapus dari database' });
    } else {
      res.status(404).json({ success: false, message: 'Artikel tidak ditemukan di database' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menghapus artikel dari database' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server berjalan di http://localhost:${PORT}`);
});
