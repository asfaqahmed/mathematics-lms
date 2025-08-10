const knex = require('../../knexfile').development;
const db = require('../db');
const path = require('path');
(async ()=> {
  console.log('Running migrations...');
  await db.migrate.latest();
  console.log('Migrations complete.');
  process.exit(0);
})();
