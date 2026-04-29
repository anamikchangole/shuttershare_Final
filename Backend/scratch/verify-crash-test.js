require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: '60c72b2f9b1d8b001c8e4c1d' }, process.env.JWT_SECRET || 'shuttershare_secret_key');

const bodyData = {
    razorpay_order_id: "order_Sj3XDCPiIglbNC",
    razorpay_payment_id: "pay_dummy123",
    razorpay_signature: "8eb8beb9910dd54edfdb20321194adf667d06cceca2c0a220b0cd9d5a5898e81",
    amount: 1000
};

fetch('http://localhost:5001/api/payments/verify', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bodyData)
}).then(res => res.json()).then(console.log).catch(console.error);
