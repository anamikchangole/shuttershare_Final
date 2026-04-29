require('dotenv').config();
const crypto = require('crypto');
const Razorpay = require('razorpay');

async function test() {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    console.log("Key ID:", process.env.RAZORPAY_KEY_ID);
    console.log("Secret:", process.env.RAZORPAY_KEY_SECRET);
    
    // Simulate order
    const order = await razorpay.orders.create({ amount: 1000, currency: 'INR' });
    console.log("Order ID:", order.id);
    
    // In real life, Razorpay frontend generates payment_id and signature.
    // Let's fake a signature manually to see if crypto matches.
    const paymentId = 'pay_dummy123456';
    const body = order.id + "|" + paymentId;
    const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    
    console.log("Generated Signature:", signature);
}
test().catch(console.error);
