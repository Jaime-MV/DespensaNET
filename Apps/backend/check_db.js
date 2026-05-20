const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://despensanet_user:TN1Cm6Xr0feM77fR3M0mHF3ce6Ja1whE@dpg-d7r705n7f7vs73cpk3u0-a.virginia-postgres.render.com/despensanet',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => client.query('SELECT * FROM alerta_stock;'))
  .then(res => { console.log("ALERTA_STOCK:", res.rows); return client.query('SELECT * FROM alerta_caducidad;'); })
  .then(res => { console.log("ALERTA_CADUCIDAD:", res.rows); client.end(); })
  .catch(console.error);
