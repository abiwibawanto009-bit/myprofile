# Tugas Website Profil dengan Integrasi CMS, Backend, & Database (MySQL XAMPP)

Tugas ini mengimplementasikan website portofolio pribadi terintegrasi dengan dashboard CMS (Content Management System) menggunakan konsep **Async JavaScript** (menggunakan `fetch` dengan `async/await`) untuk berkomunikasi dengan **Backend API (Node.js/Express)** dan menyimpan data ke **Database (MySQL/MariaDB XAMPP)**.

---

## 🚀 Fitur Utama
1. **Desain Premium (Glassmorphism)**: Tampilan visual modern dengan mode Gelap/Terang (Dark/Light Mode), efek partikel bintang dinamis di latar belakang, dan animasi scroll reveal.
2. **Dashboard CMS Lengkap (CRUD)**:
   - **Create**: Menambahkan artikel baru dengan fitur unggah gambar sampul (dikonversi ke format base64 DataURL).
   - **Read**: Menampilkan seluruh artikel di halaman utama (Beranda) dan di halaman kelola artikel CMS secara realtime.
   - **Update**: Memperbarui judul dan isi artikel langsung dari form CMS.
   - **Delete**: Menghapus artikel dari database secara realtime dengan konfirmasi keamanan.
3. **Konsep Async JavaScript**: Seluruh interaksi dengan backend (Login, Tambah/Edit/Hapus Artikel, dan Muat Data) menggunakan Async JavaScript (`async/await` fetch API) sehingga halaman tidak perlu dimuat ulang (no-reload).
4. **Otentikasi Login Admin**: Akses dashboard CMS dilindungi oleh halaman login dengan verifikasi database.
5. **Inisialisasi Database Otomatis**: Backend secara otomatis membuat database `profile_cms`, membangun struktur tabel `users` dan `articles`, dan menyemai data admin/artikel bawaan saat pertama kali dijalankan.

---

## 🛠️ Tech Stack & Struktur Proyek
- **Frontend**: HTML5, CSS3 (Vanilla Custom styling), JavaScript (Vanilla ES6, DOM Manipulation, Async/Await Fetch).
- **Backend**: Node.js, Express.js, MySQL2 (Promise version), CORS, Dotenv.
- **Database**: MySQL / MariaDB (XAMPP).
- **Struktur Direktori**:
  - `frontend/` - File antarmuka pengguna (HTML, CSS, JS statis).
  - `backend/` - File server API Node.js/Express.
  - `database.sql` - Skrip cadangan inisialisasi SQL database.
  - `README.md` - Petunjuk pengoperasian.

---

## ⚙️ Petunjuk Menjalankan Aplikasi

### Langkah 1: Jalankan MySQL Server di XAMPP
1. Buka **XAMPP Control Panel**.
2. Klik tombol **Start** pada modul **MySQL** (pastikan port `3306` aktif).
   *(Catatan: Anda juga bisa mengimpor file `database.sql` melalui phpMyAdmin jika ingin, namun backend akan mendeteksi dan membuatnya secara otomatis jika belum ada).*

### Langkah 2: Jalankan Server Backend Node.js
1. Buka Terminal/Command Prompt di folder **`backend/`**.
2. Jalankan perintah untuk menginstal dependencies:
   ```bash
   npm install
   ```
3. Jalankan server backend dengan perintah:
   ```bash
   npm start
   ```
4. Server backend akan berjalan di **`http://localhost:5000`** dan akan otomatis memverifikasi koneksi database Anda.

### Langkah 3: Akses Website
1. Buka browser dan buka alamat:
   👉 **[http://localhost:5000](http://localhost:5000)**
2. Anda akan otomatis diarahkan ke halaman login. Masukkan akun admin default berikut:
   - **Username**: `admin`
   - **Password**: `password123`
3. Setelah login berhasil, Anda dapat mengelola artikel lewat **Dashboard CMS** dan melihat hasilnya langsung di halaman utama.

---

## 🔑 Akun Akses Default (Seed Data)
- **Username**: `admin`
- **Password**: `password123`
