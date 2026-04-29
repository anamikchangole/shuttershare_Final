const mongoose = require('mongoose');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Shutter2026@admin.fzybtfh.mongodb.net/shuttershare';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find({ isVerified: false, aadhaarImage: { $exists: true } }).lean();
        
        let totalSize = 0;
        users.forEach(u => {
            if (u.aadhaarImage) {
                const sizeInMB = (u.aadhaarImage.length * 0.75) / (1024 * 1024);
                console.log(`User ${u.email} image size: ${sizeInMB.toFixed(2)} MB`);
                totalSize += sizeInMB;
            }
        });
        console.log(`Total size: ${totalSize.toFixed(2)} MB`);
        process.exit(0);
    })
    .catch(console.error);
