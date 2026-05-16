const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://despensanet_user:TN1Cm6Xr0feM77fR3M0mHF3ce6Ja1whE@dpg-d7r705n7f7vs73cpk3u0-a.virginia-postgres.render.com/despensanet',
  ssl: { rejectUnauthorized: false }
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
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
