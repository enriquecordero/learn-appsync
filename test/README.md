# Testing AppSync JavaScript Resolvers

## Archivos de Test

### `simple-test.js`
Test básico para el resolver de creación de libros.

**Comando**: `npm run test:resolvers`

**Funcionalidad**:
- Prueba la creación básica de libros
- Valida campos requeridos
- Simula operaciones DynamoDB

## Cómo Ejecutar

```bash
# Test básico
npm run test:resolvers
```

## Notas

- Los tests usan mocks de AppSync utilities (`util`, `put`, etc.)
- Se simula DynamoDB con objetos JavaScript
- Los tests convierten automáticamente ES modules a CommonJS para Node.js