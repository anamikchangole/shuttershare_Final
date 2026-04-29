const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Shutter2026@admin.fzybtfh.mongodb.net/shuttershare';
const JWT_SECRET = process.env.JWT_SECRET || 'shuttershare_secret_key';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        // Find admin to generate token
        const admin = await User.findOne({ role: 'admin' });
        const token = jwt.sign({ id: admin._id }, JWT_SECRET);
        
        // Find pending user
        const pending = await User.findOne({ isVerified: false });
        if (!pending) {
            console.log('No pending users');
            process.exit(0);
            return;
        }
        
        console.log(`Verifying user: ${pending._id}`);
        
        // Make HTTP POST request to API
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: `/api/admin/users/verify/${pending._id}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${data}`);
                process.exit(0);
            });
        });
        
        req.on('error', e => {
            console.error(e);
            process.exit(1);
        });
        
        req.end();
    })
    .catch(console.error);
