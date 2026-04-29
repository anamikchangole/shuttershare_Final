require('dotenv').config();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const token = jwt.sign({ id: '60c72b2f9b1d8b001c8e4c1d' }, process.env.JWT_SECRET || 'shuttershare_secret_key');

const razorpay_order_id = "order_test123";
const razorpay_payment_id = "pay_test123";
const body = razorpay_order_id + "|" + razorpay_payment_id;
const razorpay_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

const bodyData = {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount: 1000
};

fetch('http://localhost:5001/api/payments/verify', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bodyData)
}).then(res => res.text()).then(text => console.log('Response:', text)).catch(console.error);
