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
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const data = JSON.parse(event.body);
    const { taskId, completed } = data;

    if (!taskId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'ID de tarea requerido' }) };
    }

    const query = `
      UPDATE tasks
      SET completed = $1
      WHERE id = $2
      RETURNING id, text, due_date as dueDate, category, priority, completed;
    `;
    const result = await pool.query(query, [completed, taskId]);
    await pool.end();

    if (result.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Tarea no encontrada' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};