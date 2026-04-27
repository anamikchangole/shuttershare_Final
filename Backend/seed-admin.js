const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoURI = 'mongodb://localhost:27017/shuttershare'; // Adjust if different

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    aadhaarImage: { type: String }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const existingAdmin = await User.findOne({ email: 'admin@shuttershare.com' });
        if (existingAdmin) {
            console.log('Admin user already exists. Updating password...');
            existingAdmin.password = await bcrypt.hash('admin123', 10);
            existingAdmin.role = 'admin';
            existingAdmin.isVerified = true;
            await existingAdmin.save();
            console.log('Admin updated successfully.');
        } else {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new User({
                name: 'Master Admin',
                email: 'admin@shuttershare.com',
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                aadhaarImage: 'SYSTEM_ADMIN'
            });
            await admin.save();
            console.log('Admin user created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
