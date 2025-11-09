const { Pool } = require('pg');

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
    const { userId, text, dueDate, category, priority } = data;

    if (!userId || !text || !dueDate || !category || !priority) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Todos los campos son obligatorios' }) };
    }

    const query = `
      INSERT INTO tasks (user_id, text, due_date, category, priority, completed)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING id, text, due_date as dueDate, category, priority, completed;
    `;
    const result = await pool.query(query, [userId, text, dueDate, category, priority]);
    await pool.end();

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error('Error al agregar tarea:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};