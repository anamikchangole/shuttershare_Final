// ===== PROFESSIONAL SHUTTERSHARE JAVASCRIPT =====

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100,
        easing: 'ease-in-out'
    });

    // ===== CUSTOM CURSOR =====
    const cursor = document.querySelector('.custom-cursor');
    
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
    
    // Hide cursor on links and buttons
    const links = document.querySelectorAll('a, button');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
        });
        
        link.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    });

    // ===== PRELOADER =====
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelector('.preloader').classList.add('hidden');
        }, 2000);
    });

    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ===== MOBILE MENU =====
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // ===== MODAL =====
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const modalClose = document.querySelector('.modal-close');
    const modalTabs = document.querySelectorAll('.modal-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    function openModal(tab = 'login') {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Switch to correct tab
        modalTabs.forEach(t => {
            if (t.dataset.tab === tab) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
        
        authForms.forEach(form => {
            if (form.id === tab + 'Form') {
                form.classList.add('active');
            } else {
                form.classList.remove('active');
            }
        });
    }
    
    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => openModal('login'));
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => openModal('register'));
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Tab switching
    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            modalTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === tabName + 'Form') {
                    form.classList.add('active');
                }
            });
        });
    });


    // Tab Switching - Updated to handle programmatic switching
function switchTab(tab, fromButton = false) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === tab) {
            btn.classList.add('active');
        }
    });
    
    // Show correct form
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
    }
}




    // ===== FORM SUBMISSION =====
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show success message
                showNotification('Login successful! Redirecting...', 'success');
                
                // Close modal after success
                setTimeout(() => {
                    closeModal();
                }, 2000);
            }, 2000);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate passwords match
            const password = registerForm.querySelector('input[type="password"]');
            const confirmPassword = registerForm.querySelectorAll('input[type="password"]')[1];
            
            if (password.value !== confirmPassword.value) {
                showNotification('Passwords do not match!', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show success message
                showNotification('Account created! Please check your email.', 'success');
                
                // Close modal after success
                setTimeout(() => {
                    closeModal();
                }, 2000);
            }, 2000);
        });
    }

    // ===== NOTIFICATION SYSTEM =====
    function showNotification(message, type = 'success') {
        // Remove existing notification
        const existingNotif = document.querySelector('.notification');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'};
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
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }

    // ===== FILTER BUTTONS =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    const equipmentCards = document.querySelectorAll('.equipment-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter cards (demo animation)
            equipmentCards.forEach((card, index) => {
                card.style.animation = 'none';
                card.offsetHeight; // Trigger reflow
                card.style.animation = 'fadeIn 0.5s';
            });
            
            showNotification('Filtering equipment...', 'success');
        });
    });

    // ===== PARALLAX EFFECT =====
    const heroBackground = document.querySelector('.hero-background');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (heroBackground) {
            heroBackground.style.transform = `scale(1.1) translateY(${scrolled * 0.1}px)`;
        }
    });

    // ===== COUNTDOWN TIMER FOR SPECIAL OFFER =====
    function createCountdown() {
        // Set the date we're counting down to
        const countDownDate = new Date().getTime() + (7 * 24 * 60 * 60 * 1000); // 7 days from now
        
        // Update every second
        const countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = countDownDate - now;
            
            // Time calculations
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Display in a floating badge
            const countdownEl = document.createElement('div');
            countdownEl.className = 'countdown-badge';
            countdownEl.innerHTML = `
                <i class="fas fa-clock"></i>
                Special Offer Ends: ${days}d ${hours}h ${minutes}m ${seconds}s
            `;
            
            countdownEl.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(135deg, #FFB347 0%, #FF7E5F 100%);
                color: var(--primary);
                padding: 10px 20px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 14px;
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                animation: pulse 2s infinite;
            `;
            
            // Remove existing countdown
            const existing = document.querySelector('.countdown-badge');
            if (existing) existing.remove();
            
            document.body.appendChild(countdownEl);
            
            // If countdown is over
            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownEl.innerHTML = 'Offer Expired';
            }
        }, 1000);
    }
    
    // Uncomment to enable countdown
    // createCountdown();

    // ===== WISHLIST FUNCTIONALITY =====
    const wishlistBtns = document.querySelectorAll('.btn-outline .fa-heart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            this.classList.toggle('far');
            this.classList.toggle('fas');
            
            if (this.classList.contains('fas')) {
                this.style.color = '#FFB347';
                showNotification('Added to wishlist!', 'success');
            } else {
                this.style.color = '';
                showNotification('Removed from wishlist', 'success');
            }
        });
    });

    // ===== QUICK VIEW BUTTONS =====
    const quickViewBtns = document.querySelectorAll('.card-overlay .btn');
    
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const card = btn.closest('.equipment-card');
            const title = card.querySelector('.card-title').textContent;
            
            showNotification(`Viewing ${title} details...`, 'success');
            
            // In a real app, this would open a modal with product details
        });
    });

    // ===== PRICE CALCULATOR =====
    function calculateRentalPrice(days, dailyRate) {
        let total = days * dailyRate;
        
        // Weekly discount (15% off for 7+ days)
        if (days >= 7 && days < 30) {
            total = total * 0.85;
        }
        
        // Monthly discount (25% off for 30+ days)
        if (days >= 30) {
            total = total * 0.75;
        }
        
        return total;
    }

    // ===== LAZY LOADING IMAGES =====
    const images = document.querySelectorAll('img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.5s';
                
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                });
                
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));

    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== INTERACTIVE PRICE ON HOVER =====
    equipmentCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const price = card.querySelector('.current-price');
            if (price) {
                price.style.transform = 'scale(1.1)';
                price.style.color = '#FFB347';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const price = card.querySelector('.current-price');
            if (price) {
                price.style.transform = 'scale(1)';
                price.style.color = '';
            }
        });
    });

    // ===== NEWSLETTER SIGNUP =====
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            
            if (email) {
                showNotification('Thanks for subscribing! Check your email.', 'success');
                newsletterForm.reset();
            }
        });
    }

    // ===== BACK TO TOP BUTTON =====
    const backToTop = document.createElement('button');
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.className = 'back-to-top';
    backToTop.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: var(--secondary);
        color: var(--primary);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: var(--shadow-lg);
        transition: all 0.3s;
        z-index: 999;
    `;
    
    document.body.appendChild(backToTop);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.style.display = 'flex';
        } else {
            backToTop.style.display = 'none';
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ===== LOADING STATES FOR BUTTONS =====
    const allButtons = document.querySelectorAll('.btn');
    
    allButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.classList.contains('btn-primary') && !this.classList.contains('no-loading')) {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 1500);
            }
        });
    });

    // ===== ACTIVE NAVIGATION HIGHLIGHT =====
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ===== ADD ANIMATION CLASSES TO CARDS =====
    equipmentCards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.5s ${index * 0.1}s forwards`;
        card.style.opacity = '0';
    });

    // ===== ADD CSS ANIMATIONS DYNAMICALLY =====
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }
        
        .nav-menu.active {
            display: flex !important;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
            padding: 20px;
            animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .nav-link.active {
            color: var(--secondary);
        }
        
        .nav-link.active::after {
            transform: scaleX(1);
        }
    `;
    
    document.head.appendChild(style);

    // ===== ANALYTICS TRACKING (DEMO) =====
    function trackEvent(eventName, eventData) {
        console.log('📊 Event tracked:', eventName, eventData);
        // In production, send to Google Analytics, Mixpanel, etc.
    }
    
    // Track page view
    trackEvent('page_view', { page: window.location.pathname });
    
    // Track button clicks
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            trackEvent('button_click', { 
                button_text: button.textContent.trim(),
                button_class: button.className 
            });
        });
    });

    // ===== PERFORMANCE MONITORING =====
    window.addEventListener('load', () => {
        const performanceData = {
            loadTime: performance.now(),
            domSize: document.querySelectorAll('*').length,
            timestamp: new Date().toISOString()
        };
        
        console.log('📈 Performance metrics:', performanceData);
    });

    console.log('🚀 ShutterShare initialized successfully!');
});