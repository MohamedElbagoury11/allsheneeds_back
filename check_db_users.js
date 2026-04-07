const { createConnection } = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    });

    const [rows] = await connection.execute('SELECT id, name, email, role FROM user');
    console.log('--- USERS IN DATABASE ---');
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
  }
}

checkUsers();
