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
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const taskId = event.queryStringParameters?.taskid;
    if (!taskId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'ID de tarea requerido' }) };
    }

    const query = 'DELETE FROM tasks WHERE id = $1';
    const result = await pool.query(query, [taskId]);
    await pool.end();

    if (result.rowCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Tarea no encontrada' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};