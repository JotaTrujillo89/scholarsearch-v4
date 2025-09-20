const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 3000;

// Tipos MIME para diferentes archivos
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // Parsear la URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Si es la ruta raíz, servir scholarsearch_server.html
  if (pathname === '/') {
    pathname = '/scholarsearch_server.html';
  }

  // Construir ruta del archivo
  const filePath = path.join(__dirname, pathname);

  // Obtener extensión del archivo
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Agregar headers CORS para todas las respuestas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Intentar leer el archivo
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Archivo no encontrado
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Archivo no encontrado</h1><p>El archivo solicitado no existe.</p>');
      } else {
        // Error del servidor
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Error del servidor</h1><p>Error interno del servidor.</p>');
      }
    } else {
      // Archivo encontrado, enviarlo
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Iniciar el servidor
server.listen(port, 'localhost', () => {
  console.log(`\n🚀 Servidor ScholarsSearch iniciado!`);
  console.log(`📍 URL: http://localhost:${port}`);
  console.log(`🔗 Directus API: http://localhost:8055`);
  console.log(`\n✅ ScholarsSearch ahora funcionará sin problemas CORS`);
  console.log(`🛑 Para detener: Ctrl+C`);
  console.log(`\n================================================`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n\n🛑 Deteniendo servidor...');
  server.close(() => {
    console.log('✅ Servidor detenido correctamente');
    process.exit(0);
  });
});

// Manejar errores del servidor
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: El puerto ${port} ya está en uso`);
    console.log(`💡 Solución: Detén otros servicios en el puerto ${port} o cambia el puerto en servidor.js`);
  } else {
    console.error('❌ Error del servidor:', err);
  }
});