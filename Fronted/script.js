// ===== SHUTTERSHARE FRONTEND WITH BACKEND CONNECTION =====

const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {

    // Check for existing login
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
    }

    // Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100,
            easing: 'ease-in-out'
        });
    }

    // ===== CUSTOM CURSOR =====
    const cursor = document.querySelector('.custom-cursor');

    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        document.addEventListener('mousedown', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
        });

        document.addEventListener('mouseup', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        const links = document.querySelectorAll('a, button');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            });

            link.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        });
    }

    // ===== PRELOADER =====
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 2000);
        });
    }

    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // ===== MODAL =====
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const modalClose = document.querySelector('.modal-close');

    function openModal(tab = 'login') {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (tab === 'login') {
                switchTab('login');
            } else {
                switchTab('register');
            }
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    window.openModal = openModal;
    window.closeModal = closeModal;

    if (loginBtn) {
        loginBtn.addEventListener('click', () => openModal('login'));
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => openModal('register'));
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Tab Switching
    window.switchTab = function (tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase() === tab) {
                btn.classList.add('active');
            }
        });

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) loginForm.classList.remove('active');
        if (registerForm) registerForm.classList.remove('active');

        if (tab === 'login') {
            if (loginForm) loginForm.classList.add('active');
        } else {
            if (registerForm) registerForm.classList.add('active');
        }
    };

    // ===== API HELPER FUNCTIONS =====
    async function apiCall(endpoint, method = 'GET', data = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const options = { method, headers };
        if (data) options.body = JSON.stringify(data);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: error.message };
        }
    }

    // ===== AUTHENTICATION =====
    window.handleLogin = async function (event) {
        event.preventDefault();

        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            showNotification('Please enter email and password', 'error');
            return;
        }

        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;

        const result = await apiCall('/auth/login', 'POST', { email, password });

        if (result.success) {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            closeModal();
            showNotification(`Welcome back, ${currentUser.name}!`, 'success');

            // Load user-specific data
            loadMyListings();
        } else {
            showNotification(result.error || 'Login failed', 'error');
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    };

    window.handleRegister = async function (event) {
        event.preventDefault();

        const name = document.getElementById('regName')?.value;
        const email = document.getElementById('regEmail')?.value;
        const phone = document.getElementById('regPhone')?.value;
        const password = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regConfirmPassword')?.value;
        const role = document.getElementById('regRole')?.value;

        if (!name || !email || !password) {
            showNotification('Please fill all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitBtn.disabled = true;

        const result = await apiCall('/auth/register', 'POST', { name, email, phone, password, role });

        if (result.success) {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            closeModal();
            showNotification(`Welcome to ShutterShare, ${name}!`, 'success');
        } else {
            showNotification(result.error || 'Registration failed', 'error');
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    };

    function updateUIForLoggedInUser() {
        const navLinks = document.querySelector('.nav-links');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');

        if (navLinks) navLinks.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName && currentUser) userName.textContent = currentUser.name;

        // Show owner-specific elements
        if (currentUser && currentUser.role === 'owner') {
            const ownerElements = document.querySelectorAll('.owner-only');
            ownerElements.forEach(el => el.style.display = 'block');
        }
    }

    window.logout = function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        authToken = null;
        currentUser = null;

        const navLinks = document.querySelector('.nav-links');
        const userInfo = document.getElementById('userInfo');

        if (navLinks) navLinks.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';

        showNotification('Logged out successfully', 'success');
        window.location.reload();
    };

    // ===== PRODUCT FUNCTIONS =====
    window.loadProducts = async function () {
        const category = document.getElementById('categoryFilter')?.value || '';
        const minPrice = document.getElementById('minPrice')?.value || '';
        const maxPrice = document.getElementById('maxPrice')?.value || '';

        let url = '/products?';
        if (category) url += `category=${category}&`;
        if (minPrice) url += `minPrice=${minPrice}&`;
        if (maxPrice) url += `maxPrice=${maxPrice}&`;

        const result = await apiCall(url);

        const container = document.getElementById('productsGrid');
        if (container && result.success) {
            if (result.products.length === 0) {
                container.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No products found</p>';
                return;
            }

            container.innerHTML = result.products.map(product => `
                <div class="product-card" onclick="viewProduct('${product._id}')">
                    <div class="product-image" style="background-image: url('${product.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image'}')"></div>
                    <div class="product-content">
                        <h3 class="product-title">${escapeHtml(product.title)}</h3>
                        <div class="product-location"><i class="fas fa-map-marker-alt"></i> ${product.location?.city || 'N/A'}</div>
                        <div class="product-price">$${product.pricing?.daily}<span>/day</span></div>
                        <div class="product-owner"><i class="fas fa-user"></i> ${product.ownerId?.name || 'Owner'}</div>
                        ${currentUser ? `<button class="btn btn-primary rent-btn" onclick="event.stopPropagation(); rentProduct('${product._id}', ${product.pricing?.daily})">Rent Now</button>` :
                    `<button class="btn btn-outline" onclick="event.stopPropagation(); openModal('login')">Login to Rent</button>`}
                    </div>
                </div>
            `).join('');
        }
    };

    window.loadFeaturedProducts = async function () {
        const result = await apiCall('/products');
        const container = document.getElementById('featuredProducts');

        if (container && result.success) {
            const products = result.products.slice(0, 4);
            container.innerHTML = products.map(product => `
                <div class="product-card" onclick="viewProduct('${product._id}')">
                    <div class="product-image" style="background-image: url('${product.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image'}')"></div>
                    <div class="product-content">
                        <h3 class="product-title">${escapeHtml(product.title)}</h3>
                        <div class="product-location"><i class="fas fa-map-marker-alt"></i> ${product.location?.city || 'N/A'}</div>
                        <div class="product-price">$${product.pricing?.daily}<span>/day</span></div>
                    </div>
                </div>
            `).join('');
        }
    };

    function viewProduct(productId) {
        showNotification(`Viewing product details - Coming soon!`, 'info');
    }

    window.rentProduct = function (productId, dailyRate) {
        if (!currentUser) {
            openModal('login');
            showNotification('Please login to rent equipment', 'error');
            return;
        }

        // Calculate rental price
        const days = prompt('How many days do you need?', '3');
        if (days && !isNaN(days)) {
            const total = days * dailyRate;
            showNotification(`Total cost: $${total} for ${days} days. Booking coming soon!`, 'info');
        }
    };

    // ===== OWNER FUNCTIONS =====
    window.loadMyListings = async function () {
        if (!currentUser) return;

        const result = await apiCall(`/products?ownerId=${currentUser.id}`);
        const container = document.getElementById('myListings');

        if (container && result.success) {
            container.innerHTML = result.products.map(product => `
                <div class="listing-card">
                    <h4>${escapeHtml(product.title)}</h4>
                    <p>$${product.pricing?.daily}/day</p>
                    <span class="status-badge ${product.status}">${product.status}</span>
                    <button class="btn btn-outline btn-small" onclick="editListing('${product._id}')">Edit</button>
                </div>
            `).join('');
        }
    };

    window.showAddListingForm = function () {
        const form = document.getElementById('addListingForm');
        if (form) form.style.display = 'block';
    };

    window.hideAddListingForm = function () {
        const form = document.getElementById('addListingForm');
        if (form) form.style.display = 'none';
    };

    window.addNewListing = async function (event) {
        event.preventDefault();

        if (!currentUser) {
            showNotification('Please login first', 'error');
            return;
        }

        const form = event.target;
        const productData = {
            ownerId: currentUser.id,
            title: form.querySelector('#listingTitle')?.value,
            description: form.querySelector('#listingDescription')?.value,
            category: form.querySelector('#listingCategory')?.value,
            brand: form.querySelector('#listingBrand')?.value,
            pricing: {
                daily: Number(form.querySelector('#listingDailyRate')?.value),
                securityDeposit: Number(form.querySelector('#listingDeposit')?.value)
            },
            location: {
                city: form.querySelector('#listingCity')?.value,
                state: form.querySelector('#listingState')?.value
            }
        };

        const result = await apiCall('/products', 'POST', productData);

        if (result.success) {
            showNotification('Product listed successfully!', 'success');
            hideAddListingForm();
            loadMyListings();
        } else {
            showNotification(result.error || 'Failed to list product', 'error');
        }
    };

    // ===== UI NAVIGATION =====
    window.showHome = function () {
        const homePage = document.getElementById('homePage');
        const productsPage = document.getElementById('productsPage');
        const dashboardPage = document.getElementById('dashboardPage');

        if (homePage) homePage.style.display = 'block';
        if (productsPage) productsPage.style.display = 'none';
        if (dashboardPage) dashboardPage.style.display = 'none';

        loadFeaturedProducts();
    };

    window.showProducts = function () {
        const homePage = document.getElementById('homePage');
        const productsPage = document.getElementById('productsPage');
        const dashboardPage = document.getElementById('dashboardPage');

        if (homePage) homePage.style.display = 'none';
        if (productsPage) productsPage.style.display = 'block';
        if (dashboardPage) dashboardPage.style.display = 'none';

        loadProducts();
    };

    window.showDashboard = function () {
        const homePage = document.getElementById('homePage');
        const productsPage = document.getElementById('productsPage');
        const dashboardPage = document.getElementById('dashboardPage');

        if (homePage) homePage.style.display = 'none';
        if (productsPage) productsPage.style.display = 'none';
        if (dashboardPage) dashboardPage.style.display = 'block';

        loadMyListings();
    };

    window.showHowItWorks = function () {
        showNotification('How ShutterShare Works:\n\n1. Create an account\n2. List your gear or browse equipment\n3. Book and start creating!', 'info');
    };

    // Helper Functions
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function (m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function showNotification(message, type = 'success') {
        const existingNotif = document.querySelector('.notification');
        if (existingNotif) existingNotif.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : type === 'error' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
            cursor: pointer;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);

        notification.addEventListener('click', () => notification.remove());
    }

    window.showNotification = showNotification;

    // Load initial data
    loadFeaturedProducts();

    console.log('🚀 ShutterShare frontend initialized successfully!');
});