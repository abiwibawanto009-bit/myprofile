-- Skrip SQL Inisialisasi Database CMS Website Profil Abi Wibawanto
-- Nama Database: profile_cms

-- Membuat database jika belum ada
CREATE DATABASE IF NOT EXISTS `profile_cms`;
USE `profile_cms`;

-- ==========================================
-- 1. TABEL USERS (Otentikasi Admin)
-- ==========================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 2. TABEL ARTICLES (Penyimpanan Konten CMS)
-- ==========================================
CREATE TABLE IF NOT EXISTS `articles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `judul` VARCHAR(255) NOT NULL,
    `isi` TEXT NOT NULL,
    `gambar` LONGTEXT, -- Menyimpan data base64 DataURL
    `tanggal` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- SEEDING DATA AWAL (Kredensial Default & Contoh Artikel)
-- ==========================================

-- Hapus data lama jika ada untuk mencegah duplikasi saat re-import
TRUNCATE TABLE `users`;

-- Masukkan akun admin default (Username: admin, Password: password123)
INSERT INTO `users` (`username`, `password`) VALUES 
('admin', 'password123');

-- Hapus data artikel lama jika ada
TRUNCATE TABLE `articles`;

-- Masukkan artikel bawaan sebagai contoh konten awal
INSERT INTO `articles` (`judul`, `isi`, `gambar`, `tanggal`) VALUES
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
);
