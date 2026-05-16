const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://despensanet_user:TN1Cm6Xr0feM77fR3M0mHF3ce6Ja1whE@dpg-d7r705n7f7vs73cpk3u0-a.virginia-postgres.render.com/despensanet',
  ssl: { rejectUnauthorized: false }
});
async function main() {
  const res = await pool.query('SELECT activo FROM producto LIMIT 5');
  console.log('Productos activos:', res.rows);
  process.exit(0);
}
main();
