const mongoose = require('mongoose');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Shutter2026@admin.fzybtfh.mongodb.net/shuttershare';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const admin = await User.findOne({ role: 'admin' });
        console.log('Admin user found:', admin ? admin.email : 'None');
        process.exit(0);
    })
    .catch(console.error);
