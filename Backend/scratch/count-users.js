const mongoose = require('mongoose');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Shutter2026@admin.fzybtfh.mongodb.net/shuttershare';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        const User = mongoose.model('User', new mongoose.Schema({ isVerified: Boolean, aadhaarImage: String }));
        const count = await User.countDocuments({ isVerified: false, aadhaarImage: { $exists: true } });
        console.log('Pending users count:', count);
        process.exit(0);
    })
    .catch(console.error);
