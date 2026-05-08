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
        if (!localStorage.getItem("admin")) {
            localStorage.setItem("admin", JSON.stringify({ username: "admin", password: "password123" }));
        }

        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();
            const adminData = JSON.parse(localStorage.getItem("admin"));

            if (!username || !password) {
                showToast("Semua field harus diisi!", "error");
                return;
            }

            if (username === adminData.username && password === adminData.password) {
                sessionStorage.setItem("isLogin", "true");
                showToast("Login berhasil! Mengalihkan...", "success");
                setTimeout(() => window.location.href = "index.html", 1000);
            } else {
                showToast("Username atau Password salah!", "error");
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

    // CMS Add Article Logic
    const formArtikel = document.getElementById("formArtikel");
    if (formArtikel) {
        formArtikel.addEventListener("submit", (e) => {
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
                reader.onload = (event) => {
                    simpanArtikel({ judul, isi, gambar: event.target.result, tanggal: new Date().toLocaleDateString() });
                };
                reader.readAsDataURL(file);
            } else {
                simpanArtikel({ judul, isi, gambar: "", tanggal: new Date().toLocaleDateString() });
            }
        });
    }

    function simpanArtikel(artikel) {
        const data = JSON.parse(localStorage.getItem("artikel")) || [];
        data.push(artikel);
        localStorage.setItem("artikel", JSON.stringify(data));
        showToast("Artikel berhasil ditambahkan!", "success");
        setTimeout(() => window.location.reload(), 1000);
    }

    // CMS Delete Article Logic
    window.hapusArtikel = function (index) {
        if (confirm("Yakin ingin menghapus artikel ini?")) {
            const data = JSON.parse(localStorage.getItem("artikel")) || [];
            data.splice(index, 1);
            localStorage.setItem("artikel", JSON.stringify(data));
            showToast("Artikel berhasil dihapus!", "success");
            setTimeout(() => window.location.reload(), 500);
        }
    };

    // Render Articles in CMS
    const listArtikel = document.getElementById("listArtikel");
    if (listArtikel) {
        const data = JSON.parse(localStorage.getItem("artikel")) || [];
        listArtikel.innerHTML = "";

        if (data.length === 0) {
            listArtikel.innerHTML = `<p class="glass" style="padding:2rem; text-align:center; color:var(--muted)">Belum ada artikel.</p>`;
        } else {
            data.forEach((item, index) => {
                listArtikel.innerHTML += `
                    <div class="glass article-card fade-up">
                        ${item.gambar ? `<img src="${item.gambar}" alt="${item.judul}" class="article-image">` : ""}
                        <div class="article-content">
                            <h3>${item.judul}</h3>
                            <p style="font-size: 0.8rem; color: var(--accent); margin-bottom: 0.5rem">${item.tanggal || ''}</p>
                            <p>${item.isi.substring(0, 100)}...</p>
                            <button onclick="hapusArtikel(${index})" class="btn btn-danger">Hapus Artikel</button>
                        </div>
                    </div>
                `;
            });
        }
    }

    // Render Articles in Homepage (Blog Section)
    const blogArtikel = document.getElementById("blogArtikel");
    if (blogArtikel) {
        const data = JSON.parse(localStorage.getItem("artikel")) || [];
        blogArtikel.innerHTML = "";

        if (data.length === 0) {
            blogArtikel.innerHTML = `<p class="glass" style="padding:2rem; text-align:center; color:var(--muted)">Belum ada artikel yang dipublikasikan.</p>`;
        } else {
            data.forEach((item) => {
                blogArtikel.innerHTML += `
                    <div class="glass article-card fade-up">
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
});
