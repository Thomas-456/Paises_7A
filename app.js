const express = require('express');
const db = require('./db');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Variables en memoria para la función "Revertir"
let paisParaRevertir = null;
let provinciasParaRevertir = [];

// 1. READ: Listar todos los países (CRUD)
app.get('/', (req, res) => {
    db.query('SELECT * FROM paises', (err, results) => {
        if (err) throw err;
        res.render('index', { 
            paises: results, 
            puedeRevertir: paisParaRevertir !== null 
        });
    });
});

// 2. CREATE: Agregar un país
app.post('/agregar', (req, res) => {
    const { pais_descripcion } = req.body;
    db.query('INSERT INTO paises (pais_descripcion) VALUES (?)', [pais_descripcion], (err) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// 3. UPDATE: Mostrar formulario de edición y actualizar
app.get('/editar/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM paises WHERE pais_id = ?', [id], (err, results) => {
        if (err) throw err;
        res.render('edit', { pais: results[0] });
    });
});

app.post('/actualizar/:id', (req, res) => {
    const id = req.params.id;
    const { pais_descripcion } = req.body;
    db.query('UPDATE paises SET pais_descripcion = ? WHERE pais_id = ?', [pais_descripcion, id], (err) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// 4. DELETE: Eliminar un país (guardando copia para poder revertir)
app.get('/eliminar/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM paises WHERE pais_id = ?', [id], (err, paisRes) => {
        if (err) throw err;
        if (paisRes.length > 0) {
            paisParaRevertir = paisRes[0].pais_descripcion;
            db.query('SELECT * FROM provincias WHERE pais_id = ?', [id], (err, provRes) => {
                if (err) throw err;
                provinciasParaRevertir = provRes.map(p => p.pro_descripcion);

                db.query('DELETE FROM provincias WHERE pais_id = ?', [id], (err) => {
                    if (err) throw err;
                    db.query('DELETE FROM paises WHERE pais_id = ?', [id], (err) => {
                        if (err) throw err;
                        res.redirect('/');
                    });
                });
            });
        } else {
            res.redirect('/');
        }
    });
});

// 4.1. REVERTIR: Restaurar el último país eliminado con sus provincias
app.get('/revertir', (req, res) => {
    if (!paisParaRevertir) return res.redirect('/');

    db.query('INSERT INTO paises (pais_descripcion) VALUES (?)', [paisParaRevertir], (err, result) => {
        if (err) throw err;
        const nuevoPaisId = result.insertId;

        if (provinciasParaRevertir.length > 0) {
            const values = provinciasParaRevertir.map(prov => [nuevoPaisId, prov]);
            db.query('INSERT INTO provincias (pais_id, pro_descripcion) VALUES ?', [values], (err) => {
                if (err) throw err;
                paisParaRevertir = null;
                provinciasParaRevertir = [];
                res.redirect('/');
            });
        } else {
            paisParaRevertir = null;
            res.redirect('/');
        }
    });
});

// 5. MASTER-DETAIL: Ver provincias de un país seleccionado
app.get('/provincias/:id', (req, res) => {
    const pais_id = req.params.id;
    db.query('SELECT * FROM paises WHERE pais_id = ?', [pais_id], (err, paisResult) => {
        if (err) throw err;
        db.query('SELECT * FROM provincias WHERE pais_id = ?', [pais_id], (err, provResults) => {
            if (err) throw err;
            res.render('provincias', { pais: paisResult[0], provincias: provResults });
        });
    });
});

// 6. RESET: Restablecer la base de datos a su estado original
app.get('/reset', (req, res) => {
    paisParaRevertir = null;
    provinciasParaRevertir = [];
    db.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
        if (err) throw err;
        db.query('TRUNCATE TABLE provincias', (err) => {
            if (err) throw err;
            db.query('TRUNCATE TABLE paises', (err) => {
                if (err) throw err;
                db.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
                    if (err) throw err;
                    
                    const paisesQuery = `INSERT INTO paises (pais_descripcion) VALUES 
                        ('Argentina'), ('Bolivia'), ('Brasil'), ('Chile'), ('Colombia'), 
                        ('Costa Rica'), ('Cuba'), ('Ecuador'), ('El Salvador'), ('Guatemala'), 
                        ('Haití'), ('Honduras'), ('México'), ('Nicaragua'), ('Panamá'), 
                        ('Paraguay'), ('Perú'), ('República Dominicana'), ('Uruguay'), ('Venezuela')`;
                    
                    db.query(paisesQuery, (err) => {
                        if (err) throw err;

                        const provQuery = `INSERT INTO provincias (pais_id, pro_descripcion) VALUES 
                            (1, 'Buenos Aires'), (1, 'Catamarca'), (1, 'Chaco'), (1, 'Chubut'), 
                            (1, 'Córdoba'), (1, 'Corrientes'), (1, 'Entre Ríos'), (1, 'Formosa'), 
                            (1, 'Jujuy'), (1, 'La Pampa'), (1, 'La Rioja'), (1, 'Mendoza'), 
                            (1, 'Misiones'), (1, 'Neuquén'), (1, 'Río Negro'), (1, 'Salta'), 
                            (1, 'San Juan'), (1, 'San Luis'), (1, 'Santa Cruz'), (1, 'Santa Fe'), 
                            (1, 'Santiago del Estero'), (1, 'Tierra del Fuego'), (1, 'Tucumán'), 
                            (1, 'Ciudad Autónoma de Buenos Aires')`;
                        
                        db.query(provQuery, (err) => {
                            if (err) throw err;
                            res.redirect('/');
                        });
                    });
                });
            });
        });
    });
});

// Iniciar servidor
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});