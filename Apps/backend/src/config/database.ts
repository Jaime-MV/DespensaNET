import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: 'postgresql://despensanet_user:TN1Cm6Xr0feM77fR3M0mHF3ce6Ja1whE@dpg-d7r705n7f7vs73cpk3u0-a/despensanet',
});

// Función de prueba de conexión test
export const connectDb = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexión a la base de datos PostgreSQL exitosa.');
    client.release();
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
  }
};
