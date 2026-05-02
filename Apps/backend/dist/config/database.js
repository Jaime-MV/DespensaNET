"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = exports.pool = void 0;
const pg_1 = require("pg");
exports.pool = new pg_1.Pool({
    connectionString: 'postgresql://despensanet_user:TN1Cm6Xr0feM77fR3M0mHF3ce6Ja1whE@dpg-d7r705n7f7vs73cpk3u0-a/despensanet',
});
const connectDb = async () => {
    try {
        const client = await exports.pool.connect();
        console.log('Conexión a la base de datos PostgreSQL exitosa.');
        client.release();
    }
    catch (err) {
        console.error('Error al conectar a la base de datos:', err);
    }
};
exports.connectDb = connectDb;
//# sourceMappingURL=database.js.map