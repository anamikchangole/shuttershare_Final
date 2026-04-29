const crypto = require('crypto');
const orderId = 'order_test123';
const paymentId = 'pay_test123';
const body = orderId + "|" + paymentId;
const secret = 'dummy_secret';
try {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');
    console.log("Signature:", expectedSignature);
} catch (e) {
    console.error("Crypto error:", e);
}
