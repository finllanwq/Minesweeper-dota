const sql = require('mssql');

const config = {
  server: 'localhost\\SQL-CLASS', // ← название твоего сервера
  database: 'Сапёр-дота', // ← название твоей БД
  options: {
    trustedConnection: true, // Windows-авторизация (без логина/пароля)
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let db;

async function connect() {
  try {
    db = await sql.connect(config);
    console.log('✅ БД подключена успешно!');
  } catch (err) {
    console.error('❌ Ошибка подключения:', err.message);
    process.exit(1);
  }
}

connect();

module.exports = { sql, getDb: () => db };