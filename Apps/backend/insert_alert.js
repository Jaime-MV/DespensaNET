const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://despensanet_user:TN1Cm6Xr0feM77fR3M0mHF3ce6Ja1whE@dpg-d7r705n7f7vs73cpk3u0-a.virginia-postgres.render.com/despensanet',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => client.query(`
    INSERT INTO alerta_stock (id_stock, tipo, cantidad_al_momento, umbral_referencia)
    VALUES (45, 'stock_minimo', 0, 5)
    RETURNING *;
  `))
  .then(res => { console.log("INSERTED ALERTA:", res.rows); client.end(); })
  .catch(console.error);
