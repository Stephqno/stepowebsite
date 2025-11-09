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
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'ID de usuario requerido' }) };
    }

    const query = `
      SELECT id, text, due_date as dueDate, category, priority, completed
      FROM tasks
      WHERE user_id = $1
      ORDER BY due_date ASC;
    `;
    const result = await pool.query(query, [userId]);
    await pool.end();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};