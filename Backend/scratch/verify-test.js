const mongoose = require('mongoose');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Shutter2026@admin.fzybtfh.mongodb.net/shuttershare';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const pending = await User.findOne({ isVerified: false });
        if (pending) {
            console.log('Found pending user:', pending._id);
        } else {
            console.log('No pending users');
        }
        process.exit(0);
    })
    .catch(console.error);
