const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '60c72b2f9b1d8b001c8e4c1d' }, 'shuttershare_secret_key');
console.log(token);
