// server.js - API completa para GitHub
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ⚠️ REEMPLAZA ESTA URL CON LA TUYA DE MONGODB ATLAS
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.1yj7gb6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Conexión a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error:', err));

// ESQUEMAS

// Usuarios
const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  edad: Number,
  telefono: String,
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now },
  direccion: {
    calle: String,
    ciudad: String,
    codigoPostal: String,
    pais: { type: String, default: 'Colombia' }
  }
});

// Productos
const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  categoria: String,
  stock: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// RUTAS

// Página principal
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: '🚀 API MongoDB funcionando!',
    endpoints: [
      'GET /api/test - Probar API',
      'GET /api/usuarios - Ver usuarios',
      'POST /api/usuarios - Crear usuario',
      'GET /api/usuarios/:id - Ver usuario específico',
      'PUT /api/usuarios/:id - Actualizar usuario',
      'DELETE /api/usuarios/:id - Eliminar usuario',
      'GET /api/productos - Ver productos',
      'POST /api/productos - Crear producto',
      'GET /api/estadisticas - Ver estadísticas'
    ],
    timestamp: new Date()
  });
});

// Prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '✅ API funcionando correctamente',
    database: 'MongoDB Atlas conectado',
    timestamp: new Date()
  });
});

// USUARIOS

// Ver todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await User.find({ activo: true }).sort({ fechaCreacion: -1 });
    res.json({
      success: true,
      data: usuarios,
      total: usuarios.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ver usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const nuevoUsuario = new User(req.body);
    const usuarioGuardado = await nuevoUsuario.save();
    res.status(201).json({ 
      success: true, 
      message: 'Usuario creado exitosamente',
      data: usuarioGuardado 
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'El email ya existe' });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
});

// Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const usuarioActualizado = await User.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!usuarioActualizado) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    res.json({ 
      success: true, 
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Eliminar usuario (desactivar)
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await User.findByIdAndUpdate(
      req.params.id, 
      { activo: false }, 
      { new: true }
    );
    
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    res.json({ 
      success: true, 
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PRODUCTOS

// Ver productos
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await Product.find({ activo: true }).sort({ fechaCreacion: -1 });
    res.json({
      success: true,
      data: productos,
      total: productos.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear producto
app.post('/api/productos', async (req, res) => {
  try {
    const nuevoProducto = new Product(req.body);
    const productoGuardado = await nuevoProducto.save();
    res.status(201).json({ 
      success: true, 
      message: 'Producto creado exitosamente',
      data: productoGuardado 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ESTADÍSTICAS
app.get('/api/estadisticas', async (req, res) => {
  try {
    const totalUsuarios = await User.countDocuments({ activo: true });
    const totalProductos = await Product.countDocuments({ activo: true });
    
    res.json({
      success: true,
      data: {
        usuarios: totalUsuarios,
        productos: totalProductos,
        fechaConsulta: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada. Ve a / para ver todas las rutas disponibles.'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌟 Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
