// server.js - API corregida con tu cadena MongoDB Atlas
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Tu cadena de MongoDB Atlas corregida
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.1yj7gb6.mongodb.net/mi_base_datos?retryWrites=true&w=majority&appName=Cluster0';

// Conexión a MongoDB
console.log('🔄 Conectando a MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ ¡Conectado exitosamente a MongoDB Atlas!');
    console.log('📊 Base de datos: mi_base_datos');
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    console.error('🔍 Verifica tu cadena de conexión y configuración de red');
  });

// ESQUEMAS DE BASE DE DATOS

// Esquema para Usuarios
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
  },
  metadatos: mongoose.Schema.Types.Mixed
});

// Esquema para Productos
const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  categoria: String,
  stock: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now },
  especificaciones: mongoose.Schema.Types.Mixed
});

// Modelos
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// RUTAS DE LA API

// 🏠 Página principal - Información de la API
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: '🚀 API MongoDB Atlas funcionando perfectamente!',
    version: '1.0.0',
    database: 'MongoDB Atlas - Cluster0',
    endpoints: {
      test: 'GET /api/test',
      usuarios: {
        listar: 'GET /api/usuarios',
        crear: 'POST /api/usuarios',
        obtener: 'GET /api/usuarios/:id',
        actualizar: 'PUT /api/usuarios/:id',
        eliminar: 'DELETE /api/usuarios/:id'
      },
      productos: {
        listar: 'GET /api/productos',
        crear: 'POST /api/productos'
      },
      utilidades: {
        estadisticas: 'GET /api/estadisticas'
      }
    },
    timestamp: new Date()
  });
});

// 🧪 Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '✅ API funcionando correctamente',
    database: 'MongoDB Atlas conectado',
    cluster: 'cluster0.1yj7gb6.mongodb.net',
    timestamp: new Date()
  });
});

// =================== RUTAS DE USUARIOS ===================

// GET - Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const { activo = 'true', limite = 50, pagina = 1 } = req.query;
    
    let filtro = {};
    if (activo !== undefined) filtro.activo = activo === 'true';
    
    const usuarios = await User.find(filtro)
      .limit(parseInt(limite))
      .skip((parseInt(pagina) - 1) * parseInt(limite))
      .sort({ fechaCreacion: -1 });
    
    const total = await User.countDocuments(filtro);
    
    res.json({
      success: true,
      data: usuarios,
      pagination: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite))
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Obtener usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    res.json({ success: true, data: usuario });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    console.log('📝 Creando nuevo usuario:', req.body);
    
    const nuevoUsuario = new User(req.body);
    const usuarioGuardado = await nuevoUsuario.save();
    
    console.log('✅ Usuario creado exitosamente:', usuarioGuardado._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Usuario creado exitosamente',
      data: usuarioGuardado 
    });
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        error: 'El email ya existe en la base de datos' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
});

// PUT - Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    console.log('📝 Actualizando usuario:', req.params.id);
    
    const usuarioActualizado = await User.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!usuarioActualizado) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    console.log('✅ Usuario actualizado exitosamente');
    
    res.json({ 
      success: true, 
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado 
    });
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE - Eliminar usuario (desactivar)
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    console.log('🗑️ Desactivando usuario:', req.params.id);
    
    const usuario = await User.findByIdAndUpdate(
      req.params.id, 
      { activo: false }, 
      { new: true }
    );
    
    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    console.log('✅ Usuario desactivado exitosamente');
    
    res.json({ 
      success: true, 
      message: 'Usuario desactivado exitosamente',
      data: { id: usuario._id, activo: usuario.activo }
    });
  } catch (error) {
    console.error('❌ Error desactivando usuario:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================== RUTAS DE PRODUCTOS ===================

// GET - Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const { categoria, limite = 50, pagina = 1 } = req.query;
    
    let filtro = { activo: true };
    if (categoria) {
      filtro.categoria = new RegExp(categoria, 'i');
    }
    
    const productos = await Product.find(filtro)
      .limit(parseInt(limite))
      .skip((parseInt(pagina) - 1) * parseInt(limite))
      .sort({ fechaCreacion: -1 });
    
    const total = await Product.countDocuments(filtro);
    
    res.json({
      success: true,
      data: productos,
      pagination: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite))
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Crear nuevo producto
app.post('/api/productos', async (req, res) => {
  try {
    console.log('📦 Creando nuevo producto:', req.body);
    
    const nuevoProducto = new Product(req.body);
    const productoGuardado = await nuevoProducto.save();
    
    console.log('✅ Producto creado exitosamente:', productoGuardado._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Producto creado exitosamente',
      data: productoGuardado 
    });
  } catch (error) {
    console.error('❌ Error creando producto:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// =================== RUTAS ADICIONALES ===================

// GET - Estadísticas generales
app.get('/api/estadisticas', async (req, res) => {
  try {
    const totalUsuarios = await User.countDocuments({ activo: true });
    const totalUsuariosInactivos = await User.countDocuments({ activo: false });
    const totalProductos = await Product.countDocuments({ activo: true });
    
    // Usuarios creados en los últimos 7 días
    const fechaSemana = new Date();
    fechaSemana.setDate(fechaSemana.getDate() - 7);
    const usuariosRecientes = await User.countDocuments({
      fechaCreacion: { $gte: fechaSemana }
    });
    
    res.json({
      success: true,
      data: {
        usuarios: {
          total: totalUsuarios,
          activos: totalUsuarios,
          inactivos: totalUsuariosInactivos,
          nuevosUltimaSemana: usuariosRecientes
        },
        productos: {
          total: totalProductos
        },
        fechaConsulta: new Date(),
        baseDatos: 'MongoDB Atlas'
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================== MANEJO DE ERRORES ===================

// Ruta para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    rutaAccedida: req.originalUrl,
    rutasDisponibles: [
      'GET /',
      'GET /api/test',
      'GET /api/usuarios',
      'POST /api/usuarios',
      'GET /api/usuarios/:id',
      'PUT /api/usuarios/:id',
      'DELETE /api/usuarios/:id',
      'GET /api/productos',
      'POST /api/productos',
      'GET /api/estadisticas'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌟 Servidor iniciado en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`📱 Endpoints disponibles:`);
  console.log(`   GET  / - Información de la API`);
  console.log(`   GET  /api/test - Prueba de funcionamiento`);
  console.log(`   GET  /api/usuarios - Listar usuarios`);
  console.log(`   POST /api/usuarios - Crear usuario`);
  console.log(`   GET  /api/productos - Listar productos`);
  console.log(`   POST /api/productos - Crear producto`);
  console.log(`   GET  /api/estadisticas - Ver estadísticas`);
  console.log(`📋 ¡Listo para usar con Postman!`);
});

module.exports = app;
