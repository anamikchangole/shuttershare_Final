require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Payment = mongoose.model('Payment', new mongoose.Schema({}));
    await Payment.collection.dropIndex('bookingId_1').catch(console.error);
    console.log("Index dropped");
    process.exit(0);
}).catch(console.error);
