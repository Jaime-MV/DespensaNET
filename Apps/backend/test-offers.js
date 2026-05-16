const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://despensanet_user:TN1Cm6Xr0feM77fR3M0mHF3ce6Ja1whE@dpg-d7r705n7f7vs73cpk3u0-a.virginia-postgres.render.com/despensanet',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  try {
    let query = `
      SELECT o.*, p.nombre as producto_nombre, p.codigo as producto_codigo 
      FROM oferta o
      JOIN producto p ON p.id_producto = o.id_producto
      WHERE o.activa = TRUE
    `;
    const res = await pool.query(query);
    console.log('Ofertas:', res.rows.length);
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}
main();
