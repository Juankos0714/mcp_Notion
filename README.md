# Notion Documentation MCP Server

Este MCP Server te permite interactuar con plantillas de documentación de desarrollo de software en Notion usando TypeScript.

## Instalación

1. Clona o descarga el código
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura tu token de Notion:
   - Ve a https://www.notion.so/my-integrations
   - Crea una nueva integración
   - Copia el token y configúralo en el archivo .env

4. Compila el proyecto:
   ```bash
   npm run build
   ```

5. Configura los permisos:
   - En Notion, ve a la página/base de datos que quieres usar
   - Click en "..." → "Add connections" → Selecciona tu integración

## Configuración en Claude Desktop

Añade esta configuración a tu archivo de configuración de Claude Desktop:

### macOS
Ubicación: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows
Ubicación: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "notion-docs": {
      "command": "node",
      "args": ["ruta/completa/al/dist/index.js"],
      "env": {
        "NOTION_TOKEN": "tu_token_aqui"
      }
    }
  }
}
```

## Desarrollo

Para desarrollo con recarga automática:
```bash
npm run dev
```

Para producción:
```bash
npm run build
npm start
```

## Estructura del proyecto

```
notion-docs-mcp/
├── src/
│   └── index.ts          # Código principal del MCP
├── dist/                 # Archivos compilados (generados)
├── package.json
├── tsconfig.json
├── .env                 # Variables de entorno
└── README.md
```

## Herramientas Disponibles

### setup_notion_auth
Configura el token de autenticación para Notion.

**Parámetros:**
- `token` (string): Token de integración de Notion

### search_documentation
Busca páginas de documentación por término de búsqueda.

**Parámetros:**
- `query` (string): Término de búsqueda
- `filter_type` (string, opcional): "page" o "database"

### get_page_details
Obtiene detalles completos de una página específica.

**Parámetros:**
- `page_id` (string): ID de la página de Notion

### create_documentation_page
Crea nuevas páginas con plantillas predefinidas para diferentes tipos de documentación.

**Parámetros:**
- `parent_id` (string): ID de la página padre
- `title` (string): Título de la página
- `doc_type` (string): "api_endpoint", "feature", "bug_report", o "general"
- `content` (object, opcional): Contenido específico según el tipo

### update_documentation
Actualiza propiedades de páginas existentes.

**Parámetros:**
- `page_id` (string): ID de la página a actualizar
- `properties` (object): Propiedades a actualizar

### query_documentation_database
Consulta bases de datos con filtros y ordenamiento.

**Parámetros:**
- `database_id` (string): ID de la base de datos
- `filters` (object, opcional): Filtros para la consulta
- `sorts` (array, opcional): Criterios de ordenamiento

### add_content_to_page
Añade diferentes tipos de contenido a páginas existentes.

**Parámetros:**
- `page_id` (string): ID de la página
- `content_type` (string): "paragraph", "heading", "code", "list", "quote"
- `content` (string): Contenido a añadir
- `language` (string, opcional): Lenguaje para bloques de código

## Tipos de Documentación Soportados

### API Endpoint
```typescript
{
  "doc_type": "api_endpoint",
  "content": {
    "endpoint": "/api/users",
    "method": "GET",
    "description": "Obtiene lista de usuarios",
    "example": "{\n  \"users\": [...]\n}"
  }
}
```

### Feature
```typescript
{
  "doc_type": "feature",
  "content": {
    "name": "Autenticación OAuth",
    "status": "En desarrollo",
    "description": "Implementación de autenticación OAuth 2.0"
  }
}
```

### Bug Report
```typescript
{
  "doc_type": "bug_report",
  "content": {
    "title": "Error en validación de email",
    "severity": "Alta",
    "description": "El sistema no valida correctamente emails con dominios internacionales",
    "steps": "1. Ir a registro\n2. Ingresar email con dominio .мон\n3. Error de validación"
  }
}
```

## Ejemplos de uso

Una vez configurado, puedes usar comandos como:

- "Busca documentación sobre autenticación"
- "Crea una nueva página para documentar la API de usuarios"
- "Actualiza el estado de la feature X a completado"
- "Añade un ejemplo de código a la página Y"

## Troubleshooting

### Error de permisos
Asegúrate de que la integración de Notion tenga permisos sobre las páginas/bases de datos que quieres usar.

### Error de token
Verifica que el token en el archivo .env sea correcto y que la integración esté activa.

### Error de compilación
Ejecuta `npm run clean` seguido de `npm run build` para limpiar y recompilar.

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.