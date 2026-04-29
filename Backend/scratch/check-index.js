require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Payment = mongoose.model('Payment', new mongoose.Schema({}));
    const indexes = await Payment.collection.getIndexes();
    console.log(indexes);
    process.exit(0);
}).catch(console.error);
