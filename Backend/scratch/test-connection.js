const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://admin:Shutter2026@admin.fzybtfh.mongodb.net/shuttershare';

console.log('🔄 Testing connection to:', MONGODB_URI.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log('✅ Connection successful!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
