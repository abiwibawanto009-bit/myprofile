document.addEventListener('DOMContentLoaded', () => {
    // Basic Routing/Protection
    const currentPage = window.location.pathname.split("/").pop();
    const isLogin = sessionStorage.getItem("isLogin") === "true";

    // Protect index.html and cms.html
    if ((currentPage === "index.html" || currentPage === "" || currentPage === "cms.html") && !isLogin) {
        window.location.href = "login.html";
        return;
    }

    // Redirect logged-in users away from login page
    if (currentPage === "login.html" && isLogin) {
        window.location.href = "index.html";
        return;
    }

    // Theme Logic
    const themeToggleBtn = document.getElementById("themeToggle");
    let currentTheme = localStorage.getItem("theme") || "dark";

    function applyTheme(theme) {
        document.body.classList.toggle("light", theme === "light");
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = theme === "light" ? "🌙" : "☀️";
        }
        localStorage.setItem("theme", theme);
        currentTheme = theme;
    }

    applyTheme(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            applyTheme(currentTheme === "light" ? "dark" : "light");
        });
    }

    // Toast Notification System
    window.showToast = function (message, type = 'info') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    // Scroll Reveal Animation
    const fadeElements = document.querySelectorAll(".fade-up");
    function revealOnScroll() {
        fadeElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.85) {
                el.classList.add("active");
            }
        });
    }
    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); // init

    // Typing Effect Logic (Home Page)
    const typingSpan = document.getElementById('typingEffect');
    if (typingSpan) {
        const words = ["Web Developer", "Penggiat UI/UX", "Mahasiswa IT"];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function type() {
            const currentWord = words[wordIndex];
            if (isDeleting) {
                typingSpan.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typingSpan.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
            }

            let typeSpeed = isDeleting ? 50 : 100;

            if (!isDeleting && charIndex === currentWord.length) {
                typeSpeed = 2000; // Pause at end
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500; // Pause before new word
            }

            setTimeout(type, typeSpeed);
        }
        setTimeout(type, 1000);
    }

    // Login Form Logic
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) {
                showToast("Semua field harus diisi!", "error");
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    sessionStorage.setItem("isLogin", "true");
                    showToast("Login berhasil! Mengalihkan...", "success");
                    setTimeout(() => window.location.href = "index.html", 1000);
                } else {
                    showToast(data.message || "Username atau Password salah!", "error");
                }
            } catch (error) {
                console.warn("Backend offline, menggunakan otentikasi localStorage");
                if (username === "admin" && password === "password123") {
                    sessionStorage.setItem("isLogin", "true");
                    showToast("Login berhasil! (Mode Demo Offline)", "success");
                    setTimeout(() => window.location.href = "index.html", 1000);
                } else {
                    showToast("Username atau Password salah!", "error");
                }
            }
        });
    }

    // Logout Logic
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        // Remove inline display:none if it exists, so CSS classes can take over
        logoutBtn.style.display = "";

        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.removeItem("isLogin");
            showToast("Logout berhasil!", "success");
            setTimeout(() => window.location.href = "login.html", 1000);
        });
    }

    // Navigation Updates based on Login state
    const navCmsLink = document.getElementById("navCmsLink");
    if (navCmsLink) {
        navCmsLink.href = isLogin ? "cms.html" : "login.html";
        navCmsLink.textContent = isLogin ? "Dashboard CMS" : "Login";
    }

    // Base API URL
    const API_URL = "http://localhost:5000/api/articles";
    let editingId = null;

    // CMS Add/Update Article Logic
    const formArtikel = document.getElementById("formArtikel");
    if (formArtikel) {
        formArtikel.addEventListener("submit", async (e) => {
            e.preventDefault();
            const judul = document.getElementById("judul").value.trim();
            const isi = document.getElementById("isi").value.trim();
            const gambarInput = document.getElementById("gambar");
            const file = gambarInput.files[0];

            if (!judul || !isi) {
                showToast("Judul dan isi artikel tidak boleh kosong.", "error");
                return;
            }

            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    await kirimArtikel({ judul, isi, gambar: event.target.result });
                };
                reader.readAsDataURL(file);
            } else {
                const payload = { judul, isi };
                await kirimArtikel(payload);
            }
        });
    }

    async function kirimArtikel(payload) {
        const isEdit = editingId !== null;
        const url = isEdit ? `${API_URL}/${editingId}` : API_URL;
        const method = isEdit ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast(isEdit ? "Artikel berhasil diperbarui!" : "Artikel berhasil ditambahkan!", "success");
                resetForm();
                loadArticlesCMS();
                // Pemicu Notifikasi via Service Worker
                triggerPushNotification(
                    isEdit ? "Artikel Diperbarui! 📝" : "Artikel Diterbitkan! 🎉",
                    `Judul: "${payload.judul}" berhasil disimpan ke database MySQL.`
                );
            } else {
                showToast(data.message || "Gagal menyimpan artikel.", "error");
            }
        } catch (error) {
            console.warn("Backend offline, menyimpan artikel ke localStorage");
            let localArticles = JSON.parse(localStorage.getItem('articles')) || [];
            if (isEdit) {
                localArticles = localArticles.map(item => {
                    if (item.id == editingId) {
                        return { ...item, judul: payload.judul, isi: payload.isi, gambar: payload.gambar || item.gambar };
                    }
                    return item;
                });
                showToast("Artikel berhasil diperbarui! (Mode Demo Offline)", "success");
            } else {
                const newId = localArticles.length > 0 ? Math.max(...localArticles.map(a => a.id)) + 1 : 1;
                localArticles.unshift({
                    id: newId,
                    judul: payload.judul,
                    isi: payload.isi,
                    gambar: payload.gambar || '',
                    tanggal: new Date().toLocaleDateString('id-ID')
                });
                showToast("Artikel berhasil ditambahkan! (Mode Demo Offline)", "success");
            }
            localStorage.setItem('articles', JSON.stringify(localArticles));
            resetForm();
            loadArticlesCMS();
            triggerPushNotification(
                isEdit ? "Artikel Diperbarui! 📝" : "Artikel Diterbitkan! 🎉",
                `Judul: "${payload.judul}" disimpan secara lokal.`
            );
        }
    }

    // CMS Edit Article Loaded into Form
    window.editArtikel = async function (id) {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) {
                showToast("Gagal mengambil data artikel!", "error");
                return;
            }
            const item = await response.json();

            document.getElementById("judul").value = item.judul;
            document.getElementById("isi").value = item.isi;
            
            editingId = id;
            document.getElementById("formTitle").textContent = "Edit Artikel";
            document.getElementById("submitBtn").textContent = "Simpan Perubahan";
            document.getElementById("cancelBtn").style.display = "block";
            
            document.getElementById("formArtikel").scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.warn("Backend offline, memuat data edit dari localStorage");
            const localArticles = JSON.parse(localStorage.getItem('articles')) || [];
            const item = localArticles.find(a => a.id == id);
            if (item) {
                document.getElementById("judul").value = item.judul;
                document.getElementById("isi").value = item.isi;
                editingId = id;
                document.getElementById("formTitle").textContent = "Edit Artikel";
                document.getElementById("submitBtn").textContent = "Simpan Perubahan";
                document.getElementById("cancelBtn").style.display = "block";
                document.getElementById("formArtikel").scrollIntoView({ behavior: 'smooth' });
            } else {
                showToast("Terjadi kesalahan saat memuat data edit!", "error");
            }
        }
    };

    // CMS Reset Form Mode
    function resetForm() {
        editingId = null;
        const form = document.getElementById("formArtikel");
        if (form) form.reset();
        
        const formTitle = document.getElementById("formTitle");
        const submitBtn = document.getElementById("submitBtn");
        const cancelBtn = document.getElementById("cancelBtn");
        
        if (formTitle) formTitle.textContent = "Tambah Artikel / Goal Baru";
        if (submitBtn) submitBtn.textContent = "Terbitkan Artikel";
        if (cancelBtn) cancelBtn.style.display = "none";
    }

    const cancelBtn = document.getElementById("cancelBtn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetForm();
        });
    }

    // CMS Delete Article Logic
    window.hapusArtikel = async function (id) {
        if (confirm("Yakin ingin menghapus artikel ini dari database?")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: "DELETE"
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    showToast("Artikel berhasil dihapus!", "success");
                    loadArticlesCMS();
                    // Pemicu Notifikasi via Service Worker
                    triggerPushNotification("Artikel Dihapus! 🗑️", "Satu artikel berhasil dihapus dari database MySQL.");
                } else {
                    showToast(data.message || "Gagal menghapus artikel", "error");
                }
            } catch (error) {
                console.warn("Backend offline, menghapus artikel dari localStorage");
                let localArticles = JSON.parse(localStorage.getItem('articles')) || [];
                localArticles = localArticles.filter(item => item.id != id);
                localStorage.setItem('articles', JSON.stringify(localArticles));
                showToast("Artikel berhasil dihapus! (Mode Demo Offline)", "success");
                loadArticlesCMS();
                triggerPushNotification("Artikel Dihapus! 🗑️", "Satu artikel telah dihapus secara lokal.");
            }
        }
    };

    // Render Articles in CMS
    async function loadArticlesCMS() {
        const listArtikel = document.getElementById("listArtikel");
        if (!listArtikel) return;
        listArtikel.innerHTML = "";

        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            renderCMSArticles(data);
        } catch (error) {
            console.warn("Backend offline, memuat data CMS dari localStorage");
            let localArticles = JSON.parse(localStorage.getItem('articles')) || [];
            if (localArticles.length === 0) {
                localArticles = seedArticles();
            }
            renderCMSArticles(localArticles);
        }
    }

    function renderCMSArticles(data) {
        const listArtikel = document.getElementById("listArtikel");
        if (!listArtikel) return;
        listArtikel.innerHTML = "";
        if (data.length === 0) {
            listArtikel.innerHTML = `<p class="glass" style="padding:2rem; text-align:center; color:var(--muted)">Belum ada artikel.</p>`;
        } else {
            data.forEach((item) => {
                listArtikel.innerHTML += `
                    <div class="glass article-card fade-up active">
                        ${item.gambar ? `<img src="${item.gambar}" alt="${item.judul}" class="article-image">` : ""}
                        <div class="article-content">
                            <h3>${item.judul}</h3>
                            <p style="font-size: 0.8rem; color: var(--accent); margin-bottom: 0.5rem">${item.tanggal || ''}</p>
                            <p>${item.isi.substring(0, 100)}...</p>
                            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                                <button onclick="editArtikel(${item.id})" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;">Edit</button>
                                <button onclick="hapusArtikel(${item.id})" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85rem;">Hapus</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    }

    async function loadArticlesHome() {
        const blogArtikel = document.getElementById("blogArtikel");
        if (!blogArtikel) return;
        blogArtikel.innerHTML = "";

        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            renderHomeArticles(data);
        } catch (error) {
            console.warn("Backend offline, memuat data Beranda dari localStorage");
            let localArticles = JSON.parse(localStorage.getItem('articles')) || [];
            if (localArticles.length === 0) {
                localArticles = seedArticles();
            }
            renderHomeArticles(localArticles);
        }
    }

    function renderHomeArticles(data) {
        const blogArtikel = document.getElementById("blogArtikel");
        if (!blogArtikel) return;
        blogArtikel.innerHTML = "";
        if (data.length === 0) {
            blogArtikel.innerHTML = `<p class="glass" style="padding:2rem; text-align:center; color:var(--muted)">Belum ada artikel yang dipublikasikan.</p>`;
        } else {
            data.forEach((item) => {
                blogArtikel.innerHTML += `
                    <div class="glass article-card fade-up active">
                        ${item.gambar ? `<img src="${item.gambar}" alt="${item.judul}" class="article-image">` : ""}
                        <div class="article-content">
                            <h3>${item.judul}</h3>
                            <p style="font-size: 0.8rem; color: var(--accent); margin-bottom: 0.5rem">${item.tanggal || ''}</p>
                            <p>${item.isi}</p>
                        </div>
                    </div>
                `;
            });
        }
    }

    function seedArticles() {
        const localArticles = [
            {
                id: 1,
                judul: 'Belajar Dasar Web Development',
                isi: 'Web development adalah proses membangun dan memelihara situs web. Ini adalah pekerjaan di balik layar yang membuat situs web terlihat hebat, bekerja dengan cepat, dan berkinerja baik dengan pengalaman pengguna yang mulus. Dalam artikel ini, kita akan mempelajari dasar-dasar HTML, CSS, dan JavaScript sebagai pilar utama pembuatan website modern.',
                gambar: '',
                tanggal: '30/05/2026'
            },
            {
                id: 2,
                judul: 'Pentingnya UI/UX di Era Digital',
                isi: 'UI (User Interface) dan UX (User Experience) adalah dua elemen krusial dalam pembuatan produk digital. UI berfokus pada keindahan tampilan visual, sedangkan UX berfokus pada kenyamanan pengguna saat berinteraksi dengan produk tersebut. Kombinasi yang baik antara UI yang indah dan UX yang intuitif akan meningkatkan konversi serta kepuasan pengguna secara signifikan.',
                gambar: '',
                tanggal: '29/05/2026'
            }
        ];
        localStorage.setItem('articles', JSON.stringify(localArticles));
        return localArticles;
    }

    // Load initial articles
    loadArticlesCMS();
    loadArticlesHome();

    // Contact Form
    const Form = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("contactName").value.trim();
            const email = document.getElementById("contactEmail").value.trim();
            const message = document.getElementById("contactMessage").value.trim();

            if (!name || !email || !message) {
                showToast("Semua field harus diisi.", "error");
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast("Format email tidak valid.", "error");
                return;
            }

            showToast("Pesan berhasil dikirim! Saya akan segera merespon.", "success");
            contactForm.reset();
        });
    }

    // STAR ANIMATION BACKGROUND
    const canvas = document.getElementById("bg-canvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        let stars = [];
        let shootingStars = [];

        for (let i = 0; i < 150; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 1.5,
                alpha: Math.random()
            });
        }

        function createShootingStar() {
            return {
                x: Math.random() * width * 1.5,
                y: Math.random() * height * 0.5,
                len: Math.random() * 80 + 20,
                speed: Math.random() * 10 + 5,
                angle: Math.PI / 4,
                life: 0,
                maxLife: Math.random() * 50 + 50
            };
        }

        for (let i = 0; i < 10; i++) {
            shootingStars.push(createShootingStar());
        }

        function drawStars() {
            ctx.clearRect(0, 0, width, height);

            const isLight = document.body.classList.contains('light');
            const starColor = isLight ? "rgba(59, 130, 246, " : "rgba(255, 255, 255, ";

            stars.forEach(s => {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = starColor + s.alpha + ")";
                ctx.fill();
                s.alpha += (Math.random() - 0.5) * 0.1;
                if (s.alpha < 0.1) s.alpha = 0.1;
                if (s.alpha > 1) s.alpha = 1;
            });

            shootingStars.forEach((s, index) => {
                s.life++;
                ctx.beginPath();
                const currentAlpha = Math.max(0, 1 - (s.life / s.maxLife));
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len);
                ctx.strokeStyle = starColor + currentAlpha + ")";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                s.x -= Math.cos(s.angle) * s.speed;
                s.y += Math.sin(s.angle) * s.speed;

                if (s.life > s.maxLife || s.y > height || s.x < 0) {
                    shootingStars[index] = createShootingStar();
                }
            });

            requestAnimationFrame(drawStars);
        }
        drawStars();
    }

    // ==========================================
    // MAPS & SERVICE WORKER PUSH NOTIFICATIONS
    // ==========================================

    // 1. Inisialisasi Peta (Leaflet.js)
    const mapElement = document.getElementById('map');
    if (mapElement) {
        // Koordinat Cilacap (Jalan Kemerdekaan Timur No.32)
        const myMap = L.map('map').setView([-7.6092, 109.1178], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(myMap);

        L.marker([-7.6092, 109.1178]).addTo(myMap)
            .bindPopup('<b>Abi Wibawanto (Lokasi Saya)</b><br>Jalan Kemerdekaan Timur No.32, Bumijaya, RT.03/RW.06, Kesugihan Kidul, Kec. Kesugihan, Kabupaten Cilacap, Jawa Tengah 53272')
            .openPopup();
    }

    // 2. Registrasi Service Worker & Push Notification
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
                console.log('Service Worker terdaftar untuk demo push notification:', reg);
            })
            .catch((err) => {
                console.error('Service Worker gagal terdaftar:', err);
            });
    }

    // 3. Pemicu Notifikasi via Tombol
    const btnNotifikasiList = document.querySelectorAll('#btnNotifikasi');
    btnNotifikasiList.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!('Notification' in window)) {
                showToast('Browser Anda tidak mendukung notifikasi.', 'error');
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                showToast('Notifikasi berhasil diaktifkan!', 'success');
                triggerPushNotification('Notifikasi Aktif 🔔', 'Terima kasih telah mengaktifkan notifikasi demo di website Abi Wibawanto.');
            } else {
                showToast('Izin notifikasi ditolak.', 'error');
            }
        });
    });

    // 4. Helper trigger push notification via Service Worker
    async function triggerPushNotification(title, body) {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            try {
                const reg = await navigator.serviceWorker.ready;
                reg.showNotification(title, {
                    body: body,
                    icon: '/Myphoto.jpeg',
                    badge: '/Myphoto.jpeg',
                    vibrate: [200, 100, 200]
                });
            } catch (err) {
                console.error('Gagal menampilkan notifikasi via Service Worker:', err);
                new Notification(title, { body, icon: '/Myphoto.jpeg' });
            }
        } else if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/Myphoto.jpeg' });
        } else {
            console.log('Notifikasi terblokir atau Service Worker belum siap:', title, body);
        }
    }

    // 5. PWA Install Prompt handling
    let deferredPrompt;
    const btnInstallList = document.querySelectorAll('#btnInstall');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Mencegah Mini-infobar bawaan Chrome agar kita bisa pakai UI kustom kita
        e.preventDefault();
        // Simpan event agar bisa dipicu nanti
        deferredPrompt = e;
        // Tampilkan tombol Install di navigasi / header
        btnInstallList.forEach(btn => {
            btn.style.display = 'flex';
        });
    });

    btnInstallList.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Tampilkan prompt instalasi
                deferredPrompt.prompt();
                // Tunggu respons user
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`Pilihan user untuk instalasi: ${outcome}`);
                // Bersihkan prompt
                deferredPrompt = null;
                // Sembunyikan tombol
                btnInstallList.forEach(b => b.style.display = 'none');
            }
        });
    });

    window.addEventListener('appinstalled', (evt) => {
        console.log('Aplikasi Portofolio Abi berhasil di-install sebagai PWA!');
        showToast('Aplikasi berhasil di-install! 🎉', 'success');
        btnInstallList.forEach(btn => btn.style.display = 'none');
    });
});
