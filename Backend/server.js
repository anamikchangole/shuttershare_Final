// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const MONGODB_URI = 'mongodb+srv://admin:Shutter2026@admin.fzybtfh.mongodb.net/shuttershare';

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected successfully'))
    .catch(err => console.error('❌ MongoDB Connection error:', err));

// ========== SCHEMAS ==========

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
    location: {
        city: { type: String },
        state: { type: String }
    },
    isVerified: { type: Boolean, default: false },
    aadhaarImage: { type: String }, // Base64
    avatar: { type: String },
    coverImage: { type: String },
    bio: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['camera', 'lens', 'lighting', 'audio', 'stabilizer', 'accessory'], required: true },
    brand: { type: String, required: true },
    model: { type: String },
    condition: { type: String, enum: ['new', 'like-new', 'excellent', 'good', 'fair'], default: 'excellent' },
    pricing: {
        daily: { type: Number, required: true },
        weekly: { type: Number },
        monthly: { type: Number },
        securityDeposit: { type: Number, required: true }
    },
    images: [{
        url: { type: String },
        isPrimary: { type: Boolean, default: false }
    }],
    location: {
        city: { type: String },
        state: { type: String }
    },
    status: { type: String, enum: ['active', 'rented', 'paused', 'deleted'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
    bookingId: { type: String, unique: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number },
    dailyRate: { type: Number },
    subtotal: { type: Number },
    securityDeposit: { type: Number },
    platformFee: { type: Number },
    totalAmount: { type: Number },
    status: { type: String, enum: ['pending', 'confirmed', 'ready', 'active', 'completed', 'cancelled'], default: 'pending' },
    cancelledBy: { type: String, enum: ['renter', 'owner'] },
    createdAt: { type: Date, default: Date.now }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Payment = mongoose.model('Payment', paymentSchema);

// Helper function to generate booking ID
function generateBookingId() {
    return 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// ========== API ROUTES ==========

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'ShutterShare API is running!', timestamp: new Date() });
});

// ========== AUTH ROUTES ==========

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, role, location, aadhaarImage } = req.body;

        if (!aadhaarImage) {
            return res.status(400).json({ error: 'Aadhaar card image is required for verification' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'user',
            location,
            aadhaarImage,
            isVerified: false
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'shuttershare_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'shuttershare_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                phone: user.phone,
                avatar: user.avatar,
                coverImage: user.coverImage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth required' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');
        const user = await User.findById(decoded.id).select('-password');
        res.json({ success: true, user });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
// Get user analytics
app.get('/api/auth/analytics', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth required' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        let earned = 0;
        let spent = 0;
        let count = 0;

        // Calculate earnings & total bookings as Owner
        const ownerBookings = await Booking.find({ ownerId: decoded.id, status: { $ne: 'cancelled' } });
        ownerBookings.forEach(b => {
            earned += b.totalAmount || 0;
            count++;
        });

        // Calculate spending as Renter
        const renterBookings = await Booking.find({ renterId: decoded.id, status: { $ne: 'cancelled' } });
        renterBookings.forEach(b => {
            spent += b.totalAmount || 0;
        });

        res.json({ success: true, earned, spent, count });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
app.put('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth required' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        const { name, phone, role, bio, location, avatar, coverImage } = req.body;
        const user = await User.findById(decoded.id);

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (bio !== undefined) user.bio = bio;
        if (location) user.location = location;
        if (avatar) user.avatar = avatar;
        if (coverImage) user.coverImage = coverImage;

        await user.save();
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                bio: user.bio,
                location: user.location,
                avatar: user.avatar,
                coverImage: user.coverImage
            }
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Admin: Get unverified users
app.get('/api/admin/users/pending', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth required' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        const admin = await User.findById(decoded.id);
        if (admin.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        // Exclude massive base64 image from the list response to drastically improve performance
        const users = await User.find({ isVerified: false, aadhaarImage: { $exists: true, $ne: null } }).select('-password -aadhaarImage');
        res.json({ success: true, users });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Admin: Get Aadhaar Image
app.get('/api/admin/users/:userId/aadhaar', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) return res.status(401).send('Auth required');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        const admin = await User.findById(decoded.id);
        if (admin.role !== 'admin') return res.status(403).send('Admin access required');

        const user = await User.findById(req.params.userId).select('aadhaarImage');
        if (!user || !user.aadhaarImage) return res.status(404).send('Not found');

        const matches = user.aadhaarImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).send('Invalid image format');
        }

        const buffer = Buffer.from(matches[2], 'base64');
        res.set('Content-Type', matches[1]);
        res.send(buffer);
    } catch (error) { res.status(500).send(error.message); }
});

// Admin: Verify user
app.post('/api/admin/users/verify/:userId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth required' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        const admin = await User.findById(decoded.id);
        if (admin.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.isVerified = true;
        await user.save();
        res.json({ success: true, message: 'User verified successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Admin: Reject user
app.delete('/api/admin/users/reject/:userId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth required' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        const admin = await User.findById(decoded.id);
        if (admin.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'Cannot reject an already verified user' });

        await User.findByIdAndDelete(req.params.userId);
        res.json({ success: true, message: 'User rejected and removed successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// ========== PRODUCT ROUTES ==========

// Get all products (with filters)
app.get('/api/products', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, city, ownerId } = req.query;
        let filter = { status: { $in: ['active', 'rented'] } };

        if (category) filter.category = category;
        if (city) filter['location.city'] = city;
        if (ownerId) filter.ownerId = ownerId;
        if (minPrice || maxPrice) {
            filter['pricing.daily'] = {};
            if (minPrice) filter['pricing.daily'].$gte = Number(minPrice);
            if (maxPrice) filter['pricing.daily'].$lte = Number(maxPrice);
        }

        const products = await Product.find(filter)
            .populate('ownerId', 'name email location rating')
            .sort('-createdAt');

        res.json({ success: true, products });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('ownerId', 'name email phone location rating');

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product (requires authentication)
app.post('/api/products', async (req, res) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        const user = await User.findById(decoded.id);
        if (!user || !user.isVerified) {
            return res.status(403).json({ error: 'Your account must be verified by an admin before you can list equipment.' });
        }

        const product = new Product({
            ...req.body,
            ownerId: decoded.id
        });

        await product.save();

        res.json({ success: true, product });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.ownerId.toString() !== decoded.id) {
            return res.status(403).json({ error: 'Not authorized to update this product' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        res.json({ success: true, product: updatedProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.ownerId.toString() !== decoded.id) {
            return res.status(403).json({ error: 'Not authorized to delete this product' });
        }

        product.status = 'deleted';
        await product.save();

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== BOOKING ROUTES ==========

// Create booking
app.post('/api/bookings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        // Check verification
        const user = await User.findById(decoded.id);
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Your account must be verified by an admin before you can rent equipment.' });
        }

        const { productId, ownerId, startDate, endDate, dailyRate, securityDeposit } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const subtotal = totalDays * dailyRate;
        const platformFee = subtotal * 0.15; // 15% platform fee
        const totalAmount = subtotal + securityDeposit + platformFee;

        const booking = new Booking({
            bookingId: generateBookingId(),
            productId,
            ownerId,
            renterId: decoded.id,
            startDate: start,
            endDate: end,
            totalDays,
            dailyRate,
            subtotal,
            securityDeposit,
            platformFee,
            totalAmount
        });

        await booking.save();
        res.json({ success: true, booking });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all bookings to calculate availability
app.get('/api/bookings/all', async (req, res) => {
    try {
        const bookings = await Booking.find({ status: { $ne: 'cancelled' } }).select('productId startDate endDate');
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's bookings (as renter)
app.get('/api/bookings/my-bookings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');
        const bookings = await Booking.find({ renterId: decoded.id })
            .populate('productId', 'title images pricing')
            .populate('ownerId', 'name email')
            .sort('-createdAt');

        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get owner's bookings (as owner)
app.get('/api/bookings/my-listings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');
        const bookings = await Booking.find({ ownerId: decoded.id })
            .populate('productId', 'title images')
            .populate('renterId', 'name email phone location isVerified createdAt')
            .sort('-createdAt');

        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update booking status
app.put('/api/bookings/:id/status', async (req, res) => {
    try {
        const { status, cancelledBy } = req.body;
        const updateData = { status };
        if (cancelledBy) updateData.cancelledBy = cancelledBy;

        const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RAZORPAY PAYMENT GATEWAY ==========

// Create Order
app.post('/api/payments/create-order', async (req, res) => {
    try {
        const { amount, currency } = req.body;
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: currency || 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Razorpay Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify Payment
app.post('/api/payments/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        // Ensure authentication token exists
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth required for payment verification' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Save the payment record
            const payment = new Payment({
                userId: decoded.id,
                razorpay_order_id,
                razorpay_payment_id,
                amount: amount || 0,
                status: 'success'
            });
            await payment.save();

            res.json({ success: true, message: "Payment verified successfully", paymentId: payment._id });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record Failed Payment
app.post('/api/payments/fail', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, amount, reason } = req.body;

        // Ensure authentication token exists
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Auth required for payment verification' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shuttershare_secret_key');

        const payment = new Payment({
            userId: decoded.id,
            razorpay_order_id: razorpay_order_id || 'unknown',
            razorpay_payment_id: razorpay_payment_id || 'failed_no_id',
            amount: amount || 0,
            status: 'failed'
        });
        await payment.save();

        res.json({ success: true, message: "Failed payment recorded", paymentId: payment._id });
    } catch (error) {
        console.error('Failed Payment Logging Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== SERVE FRONTEND ==========
const path = require('path');
app.use(express.static(path.join(__dirname, '../Fronted')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Fronted/index.html'));
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 ShutterShare Server running on http://localhost:${PORT}`);
    console.log(`📡 Open your browser at: http://localhost:${PORT}`);
});