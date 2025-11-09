const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // Neon requiere SSL
  port: 5432,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, username, password } = data;

    // Validar campos
    if (!name || !email || !username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Todos los campos son obligatorios' }) };
    }

    // Encriptar contraseña
    const hash = await bcrypt.hash(password, 10);

    // Guardar en la base de datos
    const query = `
      INSERT INTO users (name, email, username, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, username;
    `;
    const result = await pool.query(query, [name, email, username, hash]);
    await pool.end();

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: result.rows[0] }),
    };
  } catch (err) {
    console.error(err);
    if (err.message.includes('unique constraint')) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Usuario o correo ya existe' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Error del servidor' }) };
  }
};