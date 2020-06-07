import express from 'express';
import * as yup from 'yup';
import { dbConnection } from '../database';

const router = express.Router();

const productId = yup.object().shape({
  id: yup.number().positive(),
});

router.get('/', (req, res) => {
  try {
    productId.validateSync(req.body);
  } catch (error) {
    // Fallback to sending all products
    dbConnection.all('SELECT * FROM Productos', (err, rows) => {
      if (err) res.status(500).json(err);
      else res.json(rows);
    });
    return;
  }
  // Get a single product
  dbConnection.get(
    'SELECT * FROM Producto WHERE id = (?)',
    req.body.id,
    (err, row) => {
      if (err) res.status(500).json(err);
      else res.json(row);
    },
  );
});

const insertProductSchema = yup.object().shape({
  nombre: yup
    .string()
    .required('Inserta un nombre')
    .min(8, 'Inserta un nombre de al menos 8 caracteres'),
  precio: yup
    .number()
    .required('Inserta un precio')
    .positive('Inserta un precio positivo'),
  descripcion: yup
    .string()
    .required('Inserta una descripción')
    .min(10, 'Inserta una descripción de al menos 10 caracteres'),
});

router.post('/', (req, res) => {
  try {
    insertProductSchema.validateSync(req.body);
  } catch (error) {
    res.status(406).json(error.errors);
    return;
  }
  dbConnection.run(
    'INSERT INTO Productos (nombre, precio, descripcion) VALUES (?, ?, ?)',
    req.body.nombre,
    req.body.precio,
    req.body.descripcion,
    (err: any) => {
      if (err) res.status(500).json(err);
      else res.sendStatus(200);
    },
  );
});

const updateProductSchema = yup.object().shape({
  id: yup.number().positive().required(),
  nombre: yup.string().min(8, 'Inserta un nombre de al menos 8 caracteres'),
  precio: yup.number().positive('Inserta un precio positivo'),
  descripcion: yup
    .string()
    .min(10, 'Inserta una descripción de al menos 10 caracteres'),
});

router.put('/', (req, res) => {
  try {
    updateProductSchema.validateSync(req.body);
  } catch (error) {
    res.status(406).json(error.errors);
    return;
  }
  dbConnection.get(
    'SELECT * FROM Producto WHERE id = (?)',
    req.body.id,
    (err, row) => {
      if (err) {
        res.status(500).json(err);
        return;
      } else if (row === undefined) {
        res.status(404).json(['Producto no encontrado']);
        return;
      }
      dbConnection.run(
        'UPDATE Producto SET nombre = $nombre, precio = $precio descripcion = $descripcion WHERE id = $id LIMIT 1',
        {
          $id: req.body.id,
          $nombre: req.body.nombre ?? row.nombre,
          $precio: req.body.precio ?? row.precio,
          $descripcion: req.body.descripcion ?? row.descripcion,
        },
        (err) => {
          if (err) res.status(500).json(err);
          else res.sendStatus(200);
        },
      );
    },
  );
});

export default router;