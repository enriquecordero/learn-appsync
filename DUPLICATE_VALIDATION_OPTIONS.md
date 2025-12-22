# Opciones para Validación de Duplicados en DynamoDB

## Pregunta Original
¿La validación de duplicados no se puede hacer desde el lado de DynamoDB?

## Respuesta: Sí, hay 3 opciones

### Opción 1: Conditional Writes (Más Eficiente) ✅

**Concepto**: Usar `attribute_not_exists()` en DynamoDB para que rechace automáticamente duplicados.

**Ventajas**:
- ✅ **Atómico**: Una sola operación
- ✅ **Eficiente**: No requiere Query previo
- ✅ **Garantizado**: DynamoDB maneja la concurrencia
- ✅ **Económico**: Solo 1 WCU por intento

**Limitación**: Solo funciona si usas el campo de duplicado como **Primary Key (ID)**

**Implementación**:
```javascript
// Usar titleAuthorKey como ID (en lugar de UUID)
const titleAuthorKey = cleanTitle + '#' + cleanAuthor;
const id = titleAuthorKey; // CLAVE: Usar como ID

return put({
    key: { id: id },
    item: bookItem,
    condition: {
        expression: 'attribute_not_exists(id)'
    }
});
```

**Problema encontrado**: AppSync JavaScript runtime rechaza la sintaxis de `condition` (error de validación).

**Solución alternativa**: Usar VTL (Velocity Template Language) en lugar de JavaScript.

---

### Opción 2: Query en GSI + Conditional Write (Híbrido) ⚠️

**Concepto**: Hacer Query en GSI para verificar, luego usar conditional write.

**Ventajas**:
- ✅ Mantiene IDs únicos (UUID)
- ✅ Más flexible para el modelo de datos

**Desventajas**:
- ❌ Dos operaciones (Query + Put)
- ❌ Más costoso (RCU + WCU)
- ❌ No es atómico (race condition posible)

**Implementación**:
```javascript
// Paso 1: Query en GSI
const queryResult = query({
    index: 'title-author-index',
    query: { titleAuthorKey: { eq: titleAuthorKey } }
});

// Paso 2: Si no existe, crear con conditional write
if (queryResult.items.length === 0) {
    return put({
        key: { id: util.autoId() },
        item: bookItem,
        condition: { expression: 'attribute_not_exists(id)' }
    });
}
```

**Problema**: AppSync JavaScript no soporta esta sintaxis (ya lo intentamos).

---

### Opción 3: Usar VTL en lugar de JavaScript ✅ (RECOMENDADO)

**Concepto**: Usar Velocity Template Language que tiene soporte completo para conditional writes.

**Ventajas**:
- ✅ Soporte completo de DynamoDB features
- ✅ Conditional writes funcionan perfectamente
- ✅ Documentación extensa

**Desventajas**:
- ❌ Sintaxis menos moderna que JavaScript
- ❌ Más verboso

**Implementación VTL**:
```vtl
## Request Mapping Template
{
    "version": "2018-05-29",
    "operation": "PutItem",
    "key": {
        "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.title.toLowerCase().replaceAll("[^a-z0-9]", "") + "#" + $ctx.args.input.authorId.toLowerCase().replaceAll("[^a-z0-9]", ""))
    },
    "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input),
    "condition": {
        "expression": "attribute_not_exists(id)"
    }
}

## Response Mapping Template
#if($ctx.error)
    #if($ctx.error.type == "DynamoDB:ConditionalCheckFailedException")
        $util.error("A book with this title and author already exists", "DuplicateBookError")
    #else
        $util.error($ctx.error.message, $ctx.error.type)
    #end
#end
$util.toJson($ctx.result)
```

---

## Comparación de Opciones

| Opción | Operaciones | Costo | Atómico | Complejidad | AppSync Support |
|--------|-------------|-------|---------|-------------|-----------------|
| **Conditional Write (JS)** | 1 | Bajo | ✅ | Baja | ❌ (sintaxis rechazada) |
| **Query + Put (JS)** | 2 | Medio | ❌ | Media | ❌ (sintaxis rechazada) |
| **Conditional Write (VTL)** | 1 | Bajo | ✅ | Media | ✅ **FUNCIONA** |
| **Pipeline (JS)** | 2 | Medio | ❌ | Alta | ❌ (sintaxis rechazada) |

---

## Recomendación Final 🎯

### Para Producción:
**Usar VTL con Conditional Writes**

```typescript
// En CDK
DSBook.createResolver('CreateBookResolver', {
  typeName: 'Mutation',
  fieldName: 'createBook',
  requestMappingTemplate: MappingTemplate.fromFile('resolvers/vtl/createBook.req.vtl'),
  responseMappingTemplate: MappingTemplate.fromFile('resolvers/vtl/createBook.res.vtl'),
});
```

**Beneficios**:
- ✅ Una sola operación DynamoDB
- ✅ Atómico y garantizado
- ✅ Bajo costo (1 WCU)
- ✅ Funciona perfectamente en AppSync
- ✅ Previene race conditions

### Para Desarrollo/Testing:
**Usar el resolver JavaScript actual sin validación**

Esto permite desarrollo rápido y testing. La validación se puede agregar en la capa de aplicación o usando VTL en producción.

---

## Estado Actual del Proyecto

**Implementado**: Resolver JavaScript simple sin validación de duplicados
**Razón**: AppSync JavaScript runtime rechaza la sintaxis de conditional writes
**Próximo paso**: Implementar VTL resolver con conditional writes si se requiere validación de duplicados en producción

---

## Archivos Creados (No Funcionales en AppSync)

Los siguientes archivos fueron creados pero no funcionan con AppSync JavaScript runtime:
- `createBookWithDuplicateCheck.js` - Conditional write con titleAuthorKey como ID
- `createBookWithDuplicateCheckSimple.js` - Versión simplificada

Estos archivos se mantienen como referencia para cuando AppSync soporte esta sintaxis o para migrar a VTL.