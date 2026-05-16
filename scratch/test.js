const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/despensanet?schema=public',
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT
        COALESCE(SUM(total), 0)  AS total_ventas,
        COUNT(*)                 AS total_transacciones
      FROM venta
      WHERE fecha_hora >= CURRENT_DATE
        AND fecha_hora <  CURRENT_DATE + INTERVAL '1 day'
    `);
    console.log("DASHBOARD QUERY RESULT:", res.rows);

    const res2 = await pool.query(`SELECT id_venta, total, fecha_hora FROM venta LIMIT 5`);
    console.log("VENTAS:", res2.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
