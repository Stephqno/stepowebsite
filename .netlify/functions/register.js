const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  port: 5432,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, username, password, role } = data;

    // Validaciones básicas
    if (!name || !email || !username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Todos los campos son obligatorios' }) };
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar en la base de datos
    const query = `
      INSERT INTO users (name, email, username, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, username, role;
    `;
    const result = await pool.query(query, [name, email, username, passwordHash, role || 'student']);
    await pool.end();

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: result.rows[0] }),
    };
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.message.includes('unique constraint')) {
      return { statusCode: 409, body: JSON.stringify({ error: 'El usuario o correo ya existe' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};