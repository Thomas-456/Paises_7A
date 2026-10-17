const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',        
    user: 'root',             
    password: 'Aura45#', 
    database: 'Paises_7A'   
});

connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conectado a la base de datos MySQL con ID ' + connection.threadId);
});

module.exports = connection;