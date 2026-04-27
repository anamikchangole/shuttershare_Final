const mongoose = require('mongoose');

// IMPORTANT: Replace YOUR_ACTUAL_PASSWORD with your real password
const MONGODB_URI = 'mongodb+srv://admin:YOUR_ACTUAL_PASSWORD@admin.fzybtfh.mongodb.net/shuttershare?appName=admin';

console.log('🔄 Connecting to MongoDB Atlas...');

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas!');
        console.log('📁 Database: shuttershare');
        console.log('📊 Collections available:');

        // List collections
        mongoose.connection.db.listCollections().toArray((err, collections) => {
            if (err) {
                console.log('Error listing collections:', err);
            } else {
                if (collections.length === 0) {
                    console.log('   No collections found yet');
                } else {
                    collections.forEach(col => {
                        console.log(`   - ${col.name}`);
                    });
                }
            }
            console.log('\n🎉 ShutterShare database is ready!');
            process.exit(0);
        });
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        console.error('\n💡 Troubleshooting tips:');
        console.error('1. Check if your password is correct');
        console.error('2. Make sure your IP address is whitelisted');
        console.error('3. Verify the database user exists');
        process.exit(1);
    });