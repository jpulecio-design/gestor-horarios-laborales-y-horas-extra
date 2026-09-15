const { getConnection } = require('./src/config/database'); 
async function probarConexion() { let connection; try { connection = await getConnection(); 
    console.log('✅ Conexión exitosa a Oracle'); 
    const result = await connection.execute(`SELECT sysdate AS fecha_actual FROM dual`); 
    console.log('Fecha desde la base de datos:', result.rows[0].FECHA_ACTUAL);
 } 
 catch (err) { console.error('❌ Falló la conexión:', err.message); 
 }

 finally { if (connection) { await connection.close(); 
    console.log('Conexión cerrada correctamente'); 
} } } 
probarConexion();