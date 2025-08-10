require('dotenv').config();
const db = require('../db');
(async ()=> {
  console.log('Seeding...');
  await require('../seeds/seed.js');
})();
