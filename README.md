# ScholarsSearch - Servidor Local 🎓

**Solución definitiva para problemas CORS en ScholarsSearch**

Este servidor local elimina completamente los problemas de CORS que ocurren al abrir archivos HTML directamente en el navegador (protocol file://). Ahora ScholarsSearch funcionará perfectamente conectándose a Directus.

## 🚀 Características

- ✅ **Sin problemas CORS**: Servidor HTTP local que elimina las restricciones
- 🎨 **Interfaz moderna**: Diseño responsivo y optimizado
- 🔍 **Búsqueda avanzada**: Filtros por año, categoría, idioma y ordenamiento
- 📱 **Mobile-friendly**: Funciona perfectamente en dispositivos móviles
- ⚡ **Cero dependencias**: Solo usa módulos nativos de Node.js
- 🔧 **Fácil instalación**: Solo dos comandos para estar funcionando

## 📋 Requisitos

- **Node.js** versión 14.0.0 o superior
- **Directus** corriendo en `http://localhost:8055`

### Verificar Node.js

```bash
node --version
```

Si no tienes Node.js instalado, descárgalo desde: https://nodejs.org/

## 🛠️ Instalación

### 1. Descargar archivos

Coloca todos estos archivos en la misma carpeta:
- `servidor.js`
- `package.json`
- `scholarsearch_server.html`
- `README.md`

### 2. Instalar (opcional)

```bash
npm install
```

**Nota**: En realidad no hay dependencias externas, pero puedes ejecutar este comando por completitud.

### 3. Ejecutar servidor

```bash
npm start
```

**O directamente:**

```bash
node servidor.js
```

## 🎯 Uso

### 1. Iniciar el servidor

```bash
node servidor.js
```

Verás este mensaje:

```
🚀 Servidor ScholarsSearch iniciado!
📍 URL: http://localhost:3000
🔗 Directus API: http://localhost:8055

✅ ScholarsSearch ahora funcionará sin problemas CORS
🛑 Para detener: Ctrl+C

================================================
```

### 2. Abrir en el navegador

Ve a: **http://localhost:3000**

### 3. ¡Listo para usar!

- Busca publicaciones académicas
- Usa filtros avanzados
- Navega por los resultados
- Todo funcionará sin errores CORS

## 🔧 Configuración

### Cambiar puerto del servidor

Edita `servidor.js` línea 6:

```javascript
const port = 3000; // Cambia por el puerto que prefieras
```

### Cambiar URL de Directus

Edita `scholarsearch_server.html` línea con `API_BASE`:

```javascript
const API_BASE = 'http://localhost:8055'; // Cambia por tu URL de Directus
```

## 🔍 Funcionalidades de búsqueda

### Filtros disponibles:

- **Términos de búsqueda**: Busca en títulos, autores y palabras clave
- **Año**: Filtra por año de publicación (2020-2024)
- **Categoría**: Filtra por área académica
- **Idioma**: Filtra por idioma de la publicación
- **Ordenamiento**: Por relevancia, fecha, título o autores

### Navegación:

- **Paginación**: Navega entre páginas de resultados
- **Resultados por página**: 10 publicaciones por página
- **Búsqueda en tiempo real**: Los filtros se aplican automáticamente

## 🛠️ Solución de problemas

### Error "Puerto ya está en uso"

```bash
❌ Error: El puerto 3000 ya está en uso
```

**Solución**: Cambia el puerto en `servidor.js` o detén el servicio que usa el puerto 3000.

### Error de conexión a Directus

```bash
❌ Error al realizar la búsqueda: Failed to fetch
```

**Verificaciones**:

1. ¿Está Directus ejecutándose?
   ```bash
   curl http://localhost:8055/server/health
   ```

2. ¿Está configurado CORS en Directus?
   - Ve a Configuración > Project Settings > CORS
   - Agrega: `http://localhost:3000`

3. ¿La URL es correcta?
   - Verifica la variable `API_BASE` en el HTML

### No se ven resultados

**Verificaciones**:

1. ¿Existe la colección "publications" en Directus?
2. ¿Los campos coinciden con los esperados?
   - `title`, `authors`, `abstract`, `publication_year`, `category`, `language`, `keywords`

## 📂 Estructura del proyecto

```
scholarsearch-server/
├── servidor.js                 # Servidor HTTP principal
├── package.json               # Configuración del proyecto
├── scholarsearch_server.html  # Interfaz web de ScholarsSearch
└── README.md                  # Esta documentación
```

## 🌐 URLs importantes

- **Aplicación**: http://localhost:3000
- **Directus Admin**: http://localhost:8055/admin
- **API Directus**: http://localhost:8055/items/publications

## ⚡ Comandos rápidos

```bash
# Iniciar servidor
npm start

# O directamente
node servidor.js

# Detener servidor
Ctrl + C

# Verificar que funciona
curl http://localhost:3000
```

## 🔒 Seguridad

- El servidor solo escucha en `localhost` (127.0.0.1)
- No hay acceso desde la red externa por defecto
- Solo sirve archivos del directorio actual

## 🆘 Soporte

### Logs útiles

El servidor muestra logs útiles en la consola:

```bash
🔍 Realizando búsqueda: http://localhost:8055/items/publications?...
📊 Resultados obtenidos: {...}
```

### Verificar en el navegador

Abre las **Herramientas de desarrollador** (F12) y mira la consola:

```javascript
🎓 ScholarsSearch cargado correctamente
🔗 Conectado a Directus API: http://localhost:8055
✅ Sin problemas CORS - Servidor funcionando correctamente
```

## 📝 Notas técnicas

### Ventajas de esta solución:

1. **Elimina CORS**: Al servir desde `http://localhost:3000`, puede conectar sin problemas a `http://localhost:8055`
2. **Sin dependencias**: Solo usa módulos nativos de Node.js
3. **Portable**: Funciona en Windows, Mac y Linux
4. **Ligero**: Servidor HTTP minimalista y eficiente

### Comparado con file://

| Aspecto | file:// | http://localhost:3000 |
|---------|---------|----------------------|
| CORS | ❌ Bloqueado | ✅ Permitido |
| APIs | ❌ Restringido | ✅ Completo acceso |
| Fetch | ❌ Limitado | ✅ Sin restricciones |
| Rendimiento | ⚡ Instant | ⚡ Casi instant |

## 🎉 ¡Disfruta ScholarsSearch sin problemas CORS!

Ahora puedes usar ScholarsSearch con toda su funcionalidad sin preocuparte por restricciones del navegador.
