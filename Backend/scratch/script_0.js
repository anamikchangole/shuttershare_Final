
        function closeBookingModal() {
            const modal = document.getElementById('bookingModal');
            if (modal) {
                modal.classList.remove('show');
                modal.classList.remove('active');
                modal.style.setProperty('display', 'none', 'important');
            }
            selectedProduct = null;
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeBookingModal();
        });

        const API_URL = 'http://localhost:5001/api';
        let authToken = localStorage.getItem('token');
        let currentUser = JSON.parse(localStorage.getItem('user'));
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let selectedProduct = null;
        let allBookings = [];
        let myOrders = [];

        if (authToken && currentUser) { showApp(); }

        function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); updateCartUI(); }
        function updateCartUI() { document.getElementById('cartCount').textContent = cart.length; }

        async function apiCall(endpoint, method = 'GET', data = null) {
            const headers = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
            const options = { method, headers };
            if (data) options.body = JSON.stringify(data);

            try {
                const response = await fetch(`${API_URL}${endpoint}`, options);
                const text = await response.text();
                const json = JSON.parse(text);
                console.log(`API ${method} ${endpoint}:`, json); // Debug log
                return json;
            } catch (e) {
                console.error(`API Error on ${endpoint}:`, e);
                showToast('Connection error. Check if server is running on port 5001.', 'error');
                throw e;
            }
        }

        async function fetchAllBookings() {
            try {
                const resultAll = await apiCall('/bookings/all');
                if (resultAll.success) allBookings = resultAll.bookings || [];

                const resultMine = await apiCall('/bookings/my-bookings');
                if (resultMine.success) myOrders = resultMine.bookings || [];
            } catch (error) {
                console.error('Failed to fetch bookings:', error);
            }
            return allBookings;
        }

        function getBookedDates(productId) {
            return allBookings.filter(b => b.productId?._id === productId || b.productId === productId)
                .map(b => ({ start: new Date(b.startDate), end: new Date(b.endDate) }));
        }

        function isDateRangeAvailable(productId, start, end) {
            const bookedDates = getBookedDates(productId);
            for (const booked of bookedDates) {
                if (start < booked.end && end > booked.start) return false;
            }
            return true;
        }

        function switchTab(tab) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

            // Find button by text or index since selector might be tricky
            const btns = document.querySelectorAll('.tab-btn');
            if (tab === 'login') btns[0].classList.add('active');
            else if (tab === 'register') btns[1].classList.add('active');
            else if (tab === 'adminLogin') btns[2].classList.add('active');

            document.getElementById(`${tab}Form`).classList.add('active');

            // Adjust landing card width for register
            const card = document.querySelector('.landing-card');
            if (tab === 'register') {
                card.style.maxWidth = '580px';
            } else {
                card.style.maxWidth = '420px';
            }
        }

        function setRegRole(role) {
            document.getElementById('regRole').value = role;
            document.querySelectorAll('#registerForm .role-card').forEach(c => c.classList.remove('active'));
            if (role === 'user') document.getElementById('regRoleRenter').classList.add('active');
            else document.getElementById('regRoleOwner').classList.add('active');
        }

        async function handleLogin(e, emailId, passwordId) {
            e.preventDefault();
            const email = document.getElementById(emailId).value.trim();
            const password = document.getElementById(passwordId).value.trim();
            const result = await apiCall('/auth/login', 'POST', { email, password });
            if (result.success) {
                authToken = result.token; currentUser = result.user;
                localStorage.setItem('token', authToken); localStorage.setItem('user', JSON.stringify(currentUser));
                showApp();
                // Automatically redirect to admin page if user is an admin
                if (currentUser.role === 'admin') {
                    showPage('admin');
                }
            } else { showToast(result.error || 'Login failed', 'error'); }
        }

        function handleAadhaarSelect(input) {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];
            document.getElementById('aadhaarFileName').textContent = file.name;
            document.getElementById('aadhaarUploadBox').style.borderColor = 'var(--success)';

            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('regAadhaarBase64').value = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        async function handleRegister(e) {
            e.preventDefault();
            console.log('Registration form submitted');
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (!name || !email || !password) {
                console.warn('Missing required fields');
                showToast('Please fill out all required fields (Name, Email, Password)', 'error');
                alert('Please fill out all required fields (Name, Email, Password)');
                return;
            }

            if (password !== confirmPassword) {
                console.warn('Passwords do not match');
                showToast('Passwords do not match!', 'error');
                return;
            }

            const aadhaar = document.getElementById('regAadhaarBase64').value;
            if (!aadhaar) {
                console.warn('Aadhaar image is missing');
                showToast('Aadhaar image is required for verification', 'error');
                alert('Aadhaar image is required for verification'); // Fallback alert
                return;
            }

            try {
                console.log('Sending registration request to API...');
                const result = await apiCall('/auth/register', 'POST', {
                    name: document.getElementById('regName').value,
                    email: document.getElementById('regEmail').value,
                    phone: document.getElementById('regPhone').value,
                    password: document.getElementById('regPassword').value,
                    role: document.getElementById('regRole').value,
                    aadhaarImage: aadhaar
                });
                
                console.log('Registration response:', result);
                if (result.success) {
                    showToast('Account created! Please login.');
                    switchTab('login');
                    document.getElementById('loginEmail').value = document.getElementById('regEmail').value;
                } else {
                    console.error('Registration failed:', result.error);
                    showToast(result.error || 'Registration failed', 'error');
                    alert(result.error || 'Registration failed');
                }
            } catch (err) {
                console.error('Registration error caught in handleRegister:', err);
                alert('Connection error. Please check the console.');
            }
        }

        function setRole(role) {
            document.getElementById('editRole').value = role;
            document.querySelectorAll('#profilePage .role-card').forEach(c => c.classList.remove('active'));
            if (role === 'user') document.getElementById('roleRenter').classList.add('active');
            else document.getElementById('roleOwner').classList.add('active');
        }

        function setEqCategory(cat) {
            document.getElementById('eqCategory').value = cat;
            document.querySelectorAll('#addEquipmentPage .role-card').forEach(c => c.classList.remove('active'));
            const map = {
                'camera': 'catCamera', 'lens': 'catLens', 'lighting': 'catLighting',
                'audio': 'catAudio', 'accessories': 'catAccessory'
            };
            if (map[cat]) document.getElementById(map[cat]).classList.add('active');
        }

        function setSelectCity(city, el) {
            document.getElementById('eqCity').value = city;
            document.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
        }

        async function showApp() {
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';

            // Update UI with user info first so it's not stuck on placeholders
            const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            document.getElementById('navAvatar').textContent = initials;
            document.getElementById('dropAvatar').textContent = initials;
            document.getElementById('profileAvatar').textContent = initials;
            document.getElementById('dropName').textContent = currentUser.name;
            document.getElementById('dropEmail').textContent = currentUser.email;
            document.getElementById('navUserName').textContent = currentUser.name.split(' ')[0];
            document.getElementById('profileName').textContent = currentUser.name;
            document.getElementById('profileEmail').textContent = currentUser.email;

            // Dynamic Verification Badge
            const badge = document.getElementById('profileVerifiedBadge');
            if (badge) {
                if (currentUser.isVerified) {
                    badge.innerHTML = `<div style="background: rgba(16, 185, 129, 0.08); color: var(--success); padding: 10px 20px; border-radius: 50px; font-size: 11px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(16, 185, 129, 0.15); height: fit-content; text-transform: uppercase;">
                        <i class="fas fa-check-circle" style="font-size: 14px;"></i> Verified
                    </div>`;
                } else {
                    badge.innerHTML = `<div style="background: rgba(230, 126, 34, 0.08); color: var(--accent-primary); padding: 10px 20px; border-radius: 50px; font-size: 11px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(230, 126, 34, 0.15); height: fit-content; text-transform: uppercase;">
                        <i class="fas fa-clock" style="font-size: 14px;"></i> Pending Verification
                    </div>`;
                }
            }

            // Admin Visibility
            const isAdmin = currentUser.role === 'admin';
            if (document.getElementById('adminLink')) document.getElementById('adminLink').style.display = isAdmin ? 'flex' : 'none';
            if (document.getElementById('adminDivider')) document.getElementById('adminDivider').style.display = isAdmin ? 'block' : 'none';

            // Avatar & Cover
            if (currentUser.avatar) {
                document.getElementById('profileAvatar').style.backgroundImage = `url(${currentUser.avatar})`;
                document.getElementById('profileAvatar').textContent = '';
                document.getElementById('navAvatar').style.backgroundImage = `url(${currentUser.avatar})`;
                document.getElementById('navAvatar').textContent = '';
                document.getElementById('dropAvatar').style.backgroundImage = `url(${currentUser.avatar})`;
                document.getElementById('dropAvatar').textContent = '';
            } else {
                document.getElementById('profileAvatar').style.backgroundImage = 'none';
                document.getElementById('navAvatar').style.backgroundImage = 'none';
                document.getElementById('dropAvatar').style.backgroundImage = 'none';
            }

            if (currentUser.coverImage) {
                document.getElementById('profileBanner').style.backgroundImage = `url(${currentUser.coverImage})`;
                document.getElementById('profileBanner').style.background = 'none';
                document.getElementById('profileBanner').style.backgroundImage = `url(${currentUser.coverImage})`;
                document.getElementById('profileBanner').style.backgroundSize = 'cover';
            } else {
                document.getElementById('profileBanner').style.background = 'var(--gradient-gold)';
            }

            // Fill edit fields
            document.getElementById('editName').value = currentUser.name;
            document.getElementById('editPhone').value = currentUser.phone || '';
            document.getElementById('editBio').value = currentUser.bio || '';
            document.getElementById('editLocation').value = currentUser.location?.city || '';
            setRole(currentUser.role);

            const isOwner = currentUser.role === 'owner';
            document.getElementById('sellMenuItem').style.display = isOwner ? 'flex' : 'none';
            document.getElementById('rentalsMenuItem').style.display = isOwner ? 'flex' : 'none';
            document.getElementById('addMenuItem').style.display = isOwner ? 'flex' : 'none';

            // Fetch data after UI is updated
            await fetchAllBookings();
            updateAnalytics();
            loadMarketplace();
            loadMyListings();
            loadBookings();
            loadIncomingRentals();
            updateCartUI();
            renderCart();
        }

        function updateAnalytics() {
            if (!allBookings) return;

            let earned = 0;
            let spent = 0;
            let count = 0;
            const currentUserId = currentUser.id || currentUser._id;

            allBookings.forEach(booking => {
                const total = booking.totalPrice || 0;
                // As Owner
                if (String(booking.ownerId._id || booking.ownerId) === String(currentUserId)) {
                    if (booking.status !== 'cancelled') {
                        earned += total;
                        count++;
                    }
                }
                // As Renter
                if (String(booking.renterId._id || booking.renterId) === String(currentUserId)) {
                    if (booking.status !== 'cancelled') {
                        spent += total;
                    }
                }
            });

            document.getElementById('statEarned').textContent = `₹${earned.toLocaleString()}`;
            document.getElementById('statSpent').textContent = `₹${spent.toLocaleString()}`;
            document.getElementById('statBookings').textContent = count;
        }

        async function loadPendingUsers() {
            if (currentUser.role !== 'admin') return;
            const list = document.getElementById('pendingUsersList');
            const res = await apiCall('/admin/users/pending');
            if (res.success) {
                if (res.users.length === 0) {
                    list.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 40px;">No pending verifications at the moment.</p>';
                    return;
                }
                list.innerHTML = res.users.map(user => `
                    <div style="background: var(--bg-deep); border-radius: 16px; padding: 25px; border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="display: flex; gap: 20px;">
                            <div style="width: 200px; height: 130px; background: #000; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-subtle);">
                                <img src="${user.aadhaarImage}" style="width: 100%; height: 100%; object-fit: contain; cursor: pointer;" onclick="window.open(this.src)">
                            </div>
                            <div>
                                <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">${user.name}</h4>
                                <p style="color: var(--text-gray); font-size: 14px; margin-bottom: 3px;"><i class="fas fa-envelope"></i> ${user.email}</p>
                                <p style="color: var(--text-gray); font-size: 14px; margin-bottom: 10px;"><i class="fas fa-phone"></i> ${user.phone || 'No phone'}</p>
                                <span style="background: rgba(230, 126, 34, 0.1); color: var(--accent-primary); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                                    ${user.role}
                                </span>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn-submit" onclick="verifyUser('${user._id}')" style="background: var(--success); width: auto; padding: 10px 20px;">Approve User</button>
                            <button style="background: transparent; color: #ef4444; border: 1px solid #ef4444; border-radius: 8px; padding: 8px; font-size: 13px; cursor: pointer;" onclick="showToast('Rejection logic coming soon')">Reject</button>
                        </div>
                    </div>
                `).join('');
            }
        }

        async function verifyUser(userId) {
            const res = await apiCall('/admin/users/verify/' + userId, 'POST');
            if (res.success) {
                showToast('User verified successfully!');
                loadPendingUsers();
            } else {
                showToast(res.error || 'Verification failed', 'error');
            }
        }

        function toggleDropdown() { document.getElementById('premiumDropdown').classList.toggle('show'); }
        function closeDropdown() { document.getElementById('premiumDropdown').classList.remove('show'); }
        document.addEventListener('click', function (e) { const area = document.getElementById('profileArea'); if (area && !area.contains(e.target)) document.getElementById('premiumDropdown').classList.remove('show'); });

        let currentCategory = 'all';
        let currentCity = 'all';

        function filterCity(city) {
            currentCity = city;
            loadMarketplace(currentCategory, city);
        }

        // ===== FIXED CATEGORY FUNCTIONS =====

        function filterCategory(category) {
            currentCategory = category;
            loadMarketplace(category, currentCity);

            // Update active state on category links
            document.querySelectorAll('.category-link').forEach(link => {
                link.classList.remove('active');

                const linkText = link.textContent.trim().toLowerCase();
                let isMatch = false;

                if (category === 'all' && linkText === 'all gear') isMatch = true;
                else if (category === 'camera' && linkText === 'cameras') isMatch = true;
                else if (category === 'lens' && linkText === 'lenses') isMatch = true;
                else if (linkText === category) isMatch = true;

                if (isMatch) link.classList.add('active');
            });

            // Switch to home page to show filtered results
            showPage('home');
        }

        async function loadMarketplace(category = 'all', city = 'all') {
            let url = '/products';
            const params = [];

            if (category !== 'all') params.push(`category=${category}`);
            if (city !== 'all') params.push(`city=${city}`);

            if (params.length > 0) url += `?${params.join('&')}`;

            const result = await apiCall(url);
            const container = document.getElementById('marketplaceGrid');

            if (result.success && result.products?.length > 0) {
                // Filter out user's own products
                let available = result.products.filter(p => (p.status === 'active' || p.status === 'rented') && (!currentUser || String(p.ownerId?._id || p.ownerId) !== String(currentUser.id)));

                if (available.length === 0) {
                    container.innerHTML = '<p style="text-align:center; color: #9ca3af;">No gear available in this category.</p>';
                    return;
                }

                container.innerHTML = available.map(p => {
                    const bookedDates = getBookedDates(p._id);
                    const isCurrentlyBooked = bookedDates.some(d => {
                        const now = new Date();
                        return now >= d.start && now <= d.end;
                    });

                    const availabilityText = isCurrentlyBooked ? '● Currently on rent' : '✓ Available for rent';
                    const availabilityClass = isCurrentlyBooked ? 'availability-booked' : 'availability-available';

                    return `
                    <div class="product-premium">
                        <div class="product-img" style="background-image: url('${p.images?.[0]?.url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300'}')">
                            <div class="product-badge">${p.category || 'GEAR'}</div>
                            <div class="availability-badge ${availabilityClass}">${availabilityText}</div>
                        </div>
                        <div class="product-details">
                            <div class="product-cat">${p.brand || 'Pro Gear'}</div>
                            <div class="product-title">${p.title}</div>
                            <div class="product-price">₹${p.pricing?.daily}<span>/day</span></div>
                            <button class="btn-add-cart" onclick="openBookingModalForProduct('${p._id}', '${p.title}', ${p.pricing?.daily}, ${p.pricing?.securityDeposit}, '${p.ownerId?._id || p.ownerId}', '${p.images?.[0]?.url || ''}')">Book Now →</button>
                        </div>
                    </div>
                `;
                }).join('');
            } else {
                container.innerHTML = '<p style="text-align:center; color: #9ca3af;">No gear available yet.</p>';
            }
        }

        function openBookingModalForProduct(id, title, rate, deposit, ownerId, imageUrl) {
            selectedProduct = { id, title, rate, deposit, ownerId, imageUrl };
            document.getElementById('bookTitle').value = title;
            document.getElementById('bookTitleDisplay').textContent = title;
            document.getElementById('bookRate').value = `₹${rate} / day`;
            document.getElementById('displayRate').textContent = `₹${rate} / day`;
            document.getElementById('deposit').value = `₹${deposit}`;
            document.getElementById('displayDeposit').textContent = `₹${deposit}`;
            document.getElementById('bookStart').value = '';
            document.getElementById('bookEnd').value = '';
            document.getElementById('totalDays').value = '';
            document.getElementById('subtotal').value = '';
            document.getElementById('serviceFee').value = '';
            document.getElementById('totalAmount').value = '';
            document.getElementById('priceBreakdown').style.display = 'none';
            document.getElementById('unavailableMsg').style.display = 'none';

            document.getElementById('bookingModal').classList.add('show');

            // Initialize Flatpickr
            const fpConfig = {
                minDate: "today",
                dateFormat: "Y-m-d",
                disable: getBookedDates(id).map(d => ({ from: d.start, to: d.end })),
                onChange: checkAvailability,
                theme: "dark"
            };

            flatpickr("#bookStart", fpConfig);
            flatpickr("#bookEnd", fpConfig);

            checkAvailability(); // Initial check for today's availability
        }



        async function checkAvailability() {
            const start = document.getElementById('bookStart').value;
            const end = document.getElementById('bookEnd').value;
            if (!start || !end || !selectedProduct) return;
            const startDate = new Date(start);
            const endDate = new Date(end);
            if (startDate >= endDate) {
                document.getElementById('unavailableMsg').textContent = 'End date must be after start date';
                document.getElementById('unavailableMsg').style.display = 'block';
                document.getElementById('confirmBookBtn').disabled = true;
                document.getElementById('priceBreakdown').style.display = 'none';
                return;
            }
            const isAvailable = isDateRangeAvailable(selectedProduct.id, startDate, endDate);
            if (!isAvailable) {
                document.getElementById('unavailableMsg').textContent = '❌ These dates are already booked.';
                document.getElementById('unavailableMsg').style.display = 'block';
                document.getElementById('confirmBookBtn').disabled = true;
                document.getElementById('priceBreakdown').style.display = 'none';
            } else {
                document.getElementById('unavailableMsg').style.display = 'none';
                document.getElementById('confirmBookBtn').disabled = false;
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                const subtotal = days * selectedProduct.rate;
                const fee = subtotal * 0.15;
                const total = subtotal + fee + selectedProduct.deposit;

                // Update hidden fields
                document.getElementById('totalDays').value = days;
                document.getElementById('subtotal').value = `₹${subtotal}`;
                document.getElementById('serviceFee').value = `₹${fee.toFixed(2)}`;
                document.getElementById('totalAmount').value = `₹${total.toFixed(2)}`;

                // Update display elements
                document.getElementById('displayDays').textContent = `${days} days`;
                document.getElementById('displaySubtotal').textContent = `₹${subtotal}`;
                document.getElementById('displayFee').textContent = `₹${fee.toFixed(2)}`;
                document.getElementById('displayTotal').textContent = `₹${total.toFixed(2)}`;
                document.getElementById('displayDeposit').textContent = `₹${selectedProduct.deposit}`;

                document.getElementById('priceBreakdown').style.display = 'block';
            }
        }

        function addToCartFromModal() {
            if (!selectedProduct) return;
            const start = document.getElementById('bookStart').value;
            const end = document.getElementById('bookEnd').value;
            if (!start || !end) { showToast('Select dates', 'error'); return; }

            const startDate = new Date(start);
            const endDate = new Date(end);
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const subtotal = totalDays * selectedProduct.rate;
            const fee = subtotal * 0.15;
            const total = subtotal + fee + selectedProduct.deposit;

            const cartItem = {
                cartId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                id: selectedProduct.id,
                title: selectedProduct.title,
                rate: selectedProduct.rate,
                deposit: selectedProduct.deposit,
                ownerId: selectedProduct.ownerId,
                imageUrl: selectedProduct.imageUrl,
                startDate: start,
                endDate: end,
                totalDays: totalDays,
                subtotal: subtotal,
                fee: fee,
                total: total
            };

            cart.push(cartItem);
            saveCart();
            showToast('Added to cart!');
            closeBookingModal();
        }



        async function checkoutCart() {
            if (cart.length === 0) return;
            const btn = document.querySelector('.btn-checkout');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing Payment...';
            }

            try {
                // 1. Calculate total amount
                const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

                // 2. Create Razorpay Order
                const orderResult = await apiCall('/payments/create-order', 'POST', {
                    amount: totalAmount,
                    currency: 'INR'
                });

                if (!orderResult.success) {
                    throw new Error(orderResult.error || 'Failed to create payment order');
                }

                const order = orderResult.order;

                // 3. Configure Razorpay Options
                const options = {
                    key: orderResult.key_id,
                    amount: order.amount,
                    currency: order.currency,
                    name: "ShutterShare",
                    description: "Premium Camera Rental",
                    order_id: order.id,
                    handler: async function (response) {
                        // 4. Verify Payment on Server
                        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Payment...';

                        const verifyResult = await apiCall('/payments/verify', 'POST', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyResult.success) {
                            // 5. Create Bookings after successful payment
                            if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizing Bookings...';

                            let successCount = 0;
                            for (const item of cart) {
                                const result = await apiCall('/bookings', 'POST', {
                                    productId: item.id,
                                    ownerId: item.ownerId,
                                    startDate: item.startDate,
                                    endDate: item.endDate,
                                    dailyRate: item.rate,
                                    securityDeposit: item.deposit,
                                    paymentId: response.razorpay_payment_id // Save payment reference
                                });
                                if (result.success) successCount++;
                            }

                            cart = [];
                            saveCart();
                            await fetchAllBookings();
                            showPage('orders');
                            showToast(`Payment Successful! Booked ${successCount} items.`);
                        } else {
                            showToast('Payment verification failed!', 'error');
                        }
                    },
                    prefill: {
                        name: currentUser?.name || "",
                        email: currentUser?.email || "",
                        contact: currentUser?.phone || ""
                    },
                    theme: {
                        color: "#E67E22"
                    },
                    modal: {
                        ondismiss: function () {
                            if (btn) {
                                btn.disabled = false;
                                btn.innerHTML = 'Complete Booking <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>';
                            }
                        }
                    }
                };

                const rzp = new Razorpay(options);
                rzp.open();

            } catch (error) {
                console.error('Checkout error:', error);
                showToast(error.message || 'Checkout failed. Please try again.', 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Complete Booking <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>';
                }
            }
        }

        async function loadBookings() {
            await fetchAllBookings();
            const container = document.getElementById('allOrders');
            if (myOrders.length > 0) {
                container.innerHTML = myOrders.map(o => `
                    <div style="display: flex; flex-direction: column; padding: 25px; border-bottom: 1px solid var(--border-subtle); gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <div style="width: 50px; height: 50px; border-radius: 10px; background-image: url('${o.productId?.images?.[0]?.url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100'}'); background-size: cover; background-position: center;"></div>
                                <div>
                                    <strong style="font-size: 16px;">${o.productId?.title}</strong><br>
                                    <small style="color: var(--text-gray);"><i class="far fa-calendar-alt"></i> ${new Date(o.startDate).toLocaleDateString()} - ${new Date(o.endDate).toLocaleDateString()}</small>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 700; margin-bottom: 5px;">₹${o.totalAmount}</div>
                                <span style="background: rgba(230,126,34,0.1); color: var(--accent-primary); padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600;">${o.status.toUpperCase()}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="openTrackingModal('${o.productId?.location?.city || 'Mumbai'}', '${o.status}', '${o.cancelledBy || ''}')" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-white); cursor: pointer; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <i class="fas fa-map-marker-alt" style="color: var(--accent-primary);"></i> Track Gear
                            </button>
                            <button onclick="showPage('home')" style="flex: 1; padding: 10px; background: transparent; border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-gray); cursor: pointer; font-size: 13px;">View Details</button>
                        </div>
                    </div>
                `).join('');
            } else { container.innerHTML = '<div style="padding: 60px; text-align: center; color: var(--text-gray);"><i class="fas fa-shopping-bag" style="font-size: 40px; margin-bottom: 15px; opacity: 0.3;"></i><p>No orders yet</p></div>'; }
        }

        async function loadMyListings() {
            const result = await apiCall(`/products?ownerId=${currentUser.id}`);
            const container = document.getElementById('myListingsGrid');
            if (result.success && result.products?.length > 0) {
                container.innerHTML = result.products.map(p => `<div class="product-premium"><div class="product-img" style="background-image: url('${p.images?.[0]?.url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300'}')"></div><div class="product-details"><div class="product-title">${p.title}</div><div class="product-price">₹${p.pricing?.daily}<span>/day</span></div><button class="btn-add-cart" onclick="deleteListing('${p._id}')">Delete</button></div></div>`).join('');
            } else { container.innerHTML = '<p style="text-align:center; color: #9ca3af;">No listings yet.</p>'; }
        }

        async function addNewListing(e) {
            e.preventDefault();
            const publishBtn = document.getElementById('publishBtn');
            const btnText = publishBtn.querySelector('span');
            const btnIcon = publishBtn.querySelector('i');

            // Manual Validation
            const city = document.getElementById('eqCity').value;
            const fileInput = document.getElementById('eqImage');

            if (!city) {
                showToast('Please select a pickup city', 'error');
                return;
            }

            if (!fileInput.files || !fileInput.files[0]) {
                showToast('Please upload at least one image', 'error');
                return;
            }

            // Set loading state
            publishBtn.disabled = true;
            btnText.textContent = 'Publishing...';
            btnIcon.className = 'fas fa-spinner fa-spin';

            try {
                // Handle image upload via Base64
                let images = [];
                const file = fileInput.files[0];
                const base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.onloadend = () => {
                        const img = new Image();
                        img.onerror = () => reject(new Error('Failed to load image'));
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 800;
                            const MAX_HEIGHT = 800;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                            } else {
                                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            resolve(canvas.toDataURL('image/jpeg', 0.7));
                        };
                        img.src = reader.result;
                    };
                    reader.readAsDataURL(file);
                });
                images.push({ url: base64Image, isPrimary: true });

                const data = {
                    title: document.getElementById('eqTitle').value,
                    category: document.getElementById('eqCategory').value,
                    brand: document.getElementById('eqBrand').value,
                    description: document.getElementById('eqDescription').value,
                    pricing: {
                        daily: Number(document.getElementById('eqDailyRate').value),
                        securityDeposit: Number(document.getElementById('eqDeposit').value)
                    },
                    location: { city: city },
                    images: images
                };

                const result = await apiCall('/products', 'POST', data);
                if (result.success) {
                    showToast('Equipment listed successfully!');
                    showPage('myListings');
                    loadMyListings();
                    loadMarketplace();
                    e.target.reset();
                    document.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
                    if (document.getElementById('fileNameDisplay')) document.getElementById('fileNameDisplay').textContent = '';
                } else {
                    showToast(result.error || 'Failed to publish listing', 'error');
                }
            } catch (err) {
                console.error('Listing Error:', err);
                showToast(err.message || 'An error occurred while publishing', 'error');
            } finally {
                // Reset button state
                publishBtn.disabled = false;
                btnText.textContent = 'Publish Listing';
                btnIcon.className = 'fas fa-check';
            }
        }

        function renderCart() {
            const container = document.getElementById('cartItemsList');
            const emptyDiv = document.getElementById('cartEmpty');
            const contentDiv = document.getElementById('cartContent');
            const cartCountHeader = document.getElementById('cartCountHeader');

            if (cartCountHeader) cartCountHeader.textContent = cart.length;

            if (cart.length === 0) {
                emptyDiv.style.display = 'block';
                contentDiv.style.display = 'none';
                if (container) container.innerHTML = '';
                return;
            }

            emptyDiv.style.display = 'none';
            contentDiv.style.display = 'grid';

            let subtotal = 0;
            let fee = 0;
            let totalDeposit = 0;

            container.innerHTML = cart.map((item) => {
                subtotal += item.subtotal;
                fee += item.fee;
                totalDeposit += item.deposit;

                return `
                    <div class="cart-card">
                        <div class="cart-card-img" style="background-image: url('${item.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300'}')"></div>
                        <div class="cart-card-info">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">${item.title}</h4>
                                    <p style="color: var(--accent-primary); font-size: 14px; font-weight: 600; margin-bottom: 10px;">₹${item.rate}/day</p>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 800; font-size: 18px;">₹${item.subtotal.toFixed(2)}</div>
                                    <div style="font-size: 12px; color: var(--text-gray);">${item.totalDays} days</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 15px; margin-top: 10px; color: var(--text-gray); font-size: 13px;">
                                <span><i class="far fa-calendar-alt" style="margin-right: 5px;"></i> ${item.startDate} to ${item.endDate}</span>
                                <span><i class="fas fa-shield-alt" style="margin-right: 5px;"></i> Deposit: ₹${item.deposit}</span>
                            </div>
                            
                            <div class="cart-item-remove" onclick="removeFromCart('${item.cartId}')">
                                <i class="fas fa-trash-alt"></i> Remove Item
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            const total = subtotal + fee + totalDeposit;
            document.getElementById('cartSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
            document.getElementById('cartDeposit').textContent = `₹${totalDeposit.toFixed(2)}`;
            document.getElementById('cartFee').textContent = `₹${fee.toFixed(2)}`;
            document.getElementById('cartTotal').textContent = `₹${total.toFixed(2)}`;
        }

        function removeFromCart(cartId) {
            cart = cart.filter(item => item.cartId !== cartId);
            saveCart();
            renderCart();
            showToast('Removed from cart');
        }

        async function deleteListing(id) { if (confirm('Delete?')) { await apiCall(`/products/${id}`, 'DELETE'); loadMyListings(); showToast('Deleted'); } }

        async function loadIncomingRentals() {
            if (currentUser.role !== 'owner') return;
            const result = await apiCall('/bookings/my-listings');
            const container = document.getElementById('incomingRentals');
            if (result.success && result.bookings?.length > 0) {
                container.innerHTML = result.bookings.map(o => `
                    <div style="display: flex; flex-direction: column; padding: 25px; border-bottom: 1px solid var(--border-subtle); gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3 style="font-size: 18px; margin-bottom: 5px;">${o.productId?.title || 'Unknown Product'}</h3>
                                <p style="color: var(--text-gray); font-size: 14px;">
                                    <i class="far fa-calendar-alt"></i> ${new Date(o.startDate).toLocaleDateString()} - ${new Date(o.endDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <span style="background: rgba(230,126,34,0.2); color: var(--accent-primary); padding: 5px 15px; border-radius: 50px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 5px;">${o.status.toUpperCase()}</span>
                                <div style="font-weight: 800; font-size: 18px; color: var(--text-white);">₹${o.totalAmount}</div>
                            </div>
                        </div>
                        
                        <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: var(--accent-primary);">Renter Details</h4>
                                <button onclick="viewRenterProfile('${encodeURIComponent(JSON.stringify(o.renterId))}')" style="background: rgba(230,126,34,0.1); border: 1px solid var(--accent-primary); color: var(--accent-primary); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;">VIEW FULL PROFILE</button>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                <div style="font-size: 14px;"><i class="fas fa-user" style="width: 20px; color: var(--text-gray);"></i> ${o.renterId?.name || 'N/A'}</div>
                                <div style="font-size: 14px;"><i class="fas fa-envelope" style="width: 20px; color: var(--text-gray);"></i> ${o.renterId?.email || 'N/A'}</div>
                            </div>
                        </div>
                        
                        ${o.status === 'pending' ? `
                            <div style="display: flex; gap: 10px; margin-top: 5px;">
                                <button onclick="updateBookingStatus('${o._id}', 'confirmed')" style="flex: 1; padding: 10px; background: var(--success); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">Confirm Booking</button>
                                <button onclick="updateBookingStatus('${o._id}', 'cancelled', 'owner')" style="flex: 1; padding: 10px; background: var(--error); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">Decline</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div style="padding: 60px; text-align: center; color: var(--text-gray);"><i class="fas fa-calendar-times" style="font-size: 40px; margin-bottom: 15px; opacity: 0.3;"></i><p>No incoming rentals yet.</p></div>';
            }
        }

        async function updateBookingStatus(id, status, cancelledBy = null) {
            const result = await apiCall(`/bookings/${id}/status`, 'PUT', { status, cancelledBy });
            if (result.success) {
                showToast(`Booking ${status}!`);
                loadIncomingRentals();
            } else {
                showToast(result.error, 'error');
            }
        }

        function showPage(p) {
            document.querySelectorAll('.page').forEach(v => v.classList.remove('active'));
            document.getElementById(`${p}Page`).classList.add('active');
            if (p === 'admin') loadPendingUsers();
            if (p === 'myListings') loadMyListings();
            if (p === 'orders') loadBookings();
            if (p === 'rentals') loadIncomingRentals();
            if (p === 'home') loadMarketplace(currentCategory);
            if (p === 'cart') renderCart();
        }
        function searchProducts() { const term = document.getElementById('searchInput').value.toLowerCase(); document.querySelectorAll('.product-premium').forEach(c => { c.style.display = c.querySelector('.product-title')?.textContent.toLowerCase().includes(term) ? 'block' : 'none'; }); }

        let trackingMap = null;
        function openTrackingModal(locationName, status, cancelledBy) {
            document.getElementById('trackingModal').classList.add('show');
            const mapDiv = document.getElementById('trackingMap');
            const overlay = document.getElementById('cancelledOverlay');

            if (status === 'cancelled') {
                mapDiv.style.display = 'none';
                overlay.style.display = 'flex';

                const titleText = cancelledBy === 'owner' ? 'Cancelled by Owner' : 'Order Cancelled';
                const descText = cancelledBy === 'owner'
                    ? 'The equipment owner has declined this booking request.'
                    : 'This order was cancelled. Location tracking is no longer active.';

                overlay.innerHTML = `
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <h3 style="font-size: 20px; margin-bottom: 8px;">${titleText}</h3>
                    <p style="font-size: 14px; color: var(--text-gray); max-width: 250px;">${descText}</p>
                `;

                // Update timeline for cancelled state
                document.getElementById('dot2').classList.remove('active');
                document.getElementById('dot2').style.borderColor = 'rgba(239, 68, 68, 0.2)';
                document.getElementById('step2Text').innerHTML = `<h4 style="font-size: 15px; margin-bottom: 4px; color: #ef4444;">${titleText}</h4><p style="font-size: 12px; color: var(--text-gray);">${descText}</p>`;
                document.getElementById('dot3').style.display = 'none';
                document.getElementById('step3Text').style.display = 'none';
                return;
            }

            // Reset for active state
            mapDiv.style.display = 'block';
            overlay.style.display = 'none';
            document.getElementById('dot2').classList.add('active');
            document.getElementById('dot2').style.borderColor = '';
            document.getElementById('step2Text').innerHTML = `<h4 style="font-size: 15px; margin-bottom: 4px;">Preparing for Pickup</h4><p style="font-size: 12px; color: var(--text-gray);">Owner is cleaning and testing the gear</p>`;
            document.getElementById('dot3').style.display = 'block';
            document.getElementById('step3Text').style.display = 'block';

            // Wait for modal transition then init map
            setTimeout(() => {
                if (trackingMap) {
                    trackingMap.remove();
                }

                // Coordinates for common Indian cities as placeholders since we don't have lat/lng in DB yet
                const cityCoords = {
                    'Mumbai': [19.0760, 72.8777],
                    'Delhi': [28.6139, 77.2090],
                    'Bangalore': [12.9716, 77.5946],
                    'Pune': [18.5204, 73.8567],
                    'Hyderabad': [17.3850, 78.4867],
                    'Chennai': [13.0827, 80.2707],
                    'Kolkata': [22.5726, 88.3639]
                };

                const coords = cityCoords[locationName] || [19.0760, 72.8777];

                trackingMap = L.map('trackingMap').setView(coords, 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(trackingMap);

                L.marker(coords).addTo(trackingMap)
                    .bindPopup(`Gear Location: ${locationName}`)
                    .openPopup();

                // Fix map size after modal opens
                trackingMap.invalidateSize();
            }, 300);
        }

        function closeTrackingModal() {
            document.getElementById('trackingModal').classList.remove('show');
        }

        function closeRenterProfileModal() { document.getElementById('renterProfileModal').classList.remove('show'); }

        window.viewRenterProfile = function (renterJson) {
            const renter = JSON.parse(decodeURIComponent(renterJson));
            const initials = renter.name.split(' ').map(n => n[0]).join('').toUpperCase();
            const joinDate = new Date(renter.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });

            const body = document.getElementById('renterProfileBody');
            body.innerHTML = `
                <div style="width: 80px; height: 80px; background: var(--gradient-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; color: var(--bg-deep); margin: 0 auto 20px; box-shadow: 0 10px 20px rgba(230, 126, 34, 0.2);">${initials}</div>
                <h3 style="font-size: 22px; margin-bottom: 5px;">${renter.name}</h3>
                <p style="color: var(--text-gray); font-size: 14px; margin-bottom: 20px;">Member since ${joinDate}</p>
                
                <div style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 8px 15px; border-radius: 50px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 25px;">
                    <i class="fas fa-check-circle"></i> ${renter.isVerified ? 'VERIFIED IDENTITY' : 'IDENTITY PENDING'}
                </div>
                
                <div style="text-align: left; background: rgba(255,255,255,0.02); border-radius: 16px; padding: 20px; border: 1px solid var(--border-subtle);">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-size: 11px; color: var(--text-gray); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Contact Email</label>
                        <div style="font-size: 15px; font-weight: 500;"><i class="fas fa-envelope" style="color: var(--accent-primary); width: 25px;"></i> ${renter.email}</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-size: 11px; color: var(--text-gray); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Phone Number</label>
                        <div style="font-size: 15px; font-weight: 500;"><i class="fas fa-phone" style="color: var(--accent-primary); width: 25px;"></i> ${renter.phone || 'Not provided'}</div>
                    </div>
                    <div>
                        <label style="display: block; font-size: 11px; color: var(--text-gray); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Location</label>
                        <div style="font-size: 15px; font-weight: 500;"><i class="fas fa-map-marker-alt" style="color: var(--accent-primary); width: 25px;"></i> ${renter.location?.city || 'Not specified'}</div>
                    </div>
                </div>
                
                <button class="btn-submit" onclick="closeRenterProfileModal()" style="margin-top: 25px; width: 100%;">Close Profile</button>
            `;

            document.getElementById('renterProfileModal').classList.add('show');
        }

        async function handleProfileImageUpdate(type, input) {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];

            try {
                const base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.onloadend = () => {
                        const img = new Image();
                        img.onerror = () => reject(new Error('Failed to load image'));
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = type === 'cover' ? 1200 : 400;
                            const MAX_HEIGHT = type === 'cover' ? 600 : 400;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                            } else {
                                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            resolve(canvas.toDataURL('image/jpeg', 0.8));
                        };
                        img.src = reader.result;
                    };
                    reader.readAsDataURL(file);
                });

                const updateData = {};
                if (type === 'avatar') {
                    updateData.avatar = base64Image;
                    document.getElementById('profileAvatar').style.backgroundImage = `url(${base64Image})`;
                    document.getElementById('profileAvatar').textContent = '';
                } else {
                    updateData.coverImage = base64Image;
                    document.getElementById('profileBanner').style.backgroundImage = `url(${base64Image})`;
                    document.getElementById('profileBanner').style.background = 'none'; // Clear gradient
                    document.getElementById('profileBanner').style.backgroundImage = `url(${base64Image})`;
                }

                const result = await apiCall('/auth/profile', 'PUT', updateData);
                if (result.success) {
                    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated!`);
                    // Update global user object if stored
                    if (window.currentUser) {
                        window.currentUser[type === 'avatar' ? 'avatar' : 'coverImage'] = base64Image;
                    }
                } else {
                    showToast(result.error || 'Update failed', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to process image', 'error');
            }
        }

        async function updateProfile() {
            try {
                const name = document.getElementById('editName').value;
                const phone = document.getElementById('editPhone').value;
                const role = document.getElementById('editRole').value;
                const bio = document.getElementById('editBio').value;
                const city = document.getElementById('editLocation').value;

                const result = await apiCall('/auth/profile', 'PUT', {
                    name, phone, role, bio, location: { city }
                });

                if (result.success) {
                    currentUser = result.user;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    showApp();
                    showToast('Profile updated successfully!');
                } else {
                    showToast(result.error || 'Failed to update profile', 'error');
                }
            } catch (error) {
                console.error('Update profile error:', error);
                showToast('Update failed', 'error');
            }
        }
        function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3000); }
        function logout() { localStorage.clear(); window.location.reload(); }
    