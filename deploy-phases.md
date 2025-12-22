# 🚀 Deployment por Fases para GSIs

## 📋 Plan de Deployment

### **Estado Actual: Phase 2**
- ✅ Tabla base con partition key `id`
- ✅ GSI `author-index` (authorId)
- ✅ GSI `publisher-index` (publisherId)

### **Próximas Fases Disponibles:**

## 🔄 Phase 3: Agregar ISBN Index

### **Qué se agrega:**
- GSI `isbn-index` para validación de duplicados por ISBN

### **Cómo deployar:**
1. Cambiar en `lib/learn-appsync-stack.ts`:
   ```typescript
   deploymentPhase: 'phase3'
   ```

2. Deploy:
   ```bash
   npx cdk deploy
   ```

3. **Tiempo estimado:** 5-10 minutos

### **Beneficios:**
- Validación rápida de duplicados por ISBN
- Queries eficientes por ISBN
- Base para resolver anti-duplicados

---

## 🔄 Phase 4: Agregar Title-Author Index

### **Qué se agrega:**
- GSI `title-author-index` para validación cuando no hay ISBN

### **Cómo deployar:**
1. Cambiar en `lib/learn-appsync-stack.ts`:
   ```typescript
   deploymentPhase: 'phase4'
   ```

2. Deploy:
   ```bash
   npx cdk deploy
   ```

3. **Tiempo estimado:** 5-10 minutos

### **Beneficios:**
- Validación de duplicados sin ISBN
- Búsquedas por título + autor
- Sistema completo anti-duplicados

---

## 📊 Resumen de Índices por Fase

| Fase | Índices Disponibles | Casos de Uso |
|------|-------------------|--------------|
| Phase 1 | `author-index` | Búsquedas por autor |
| Phase 2 | + `publisher-index` | + Búsquedas por editorial |
| Phase 3 | + `isbn-index` | + Validación duplicados ISBN |
| Phase 4 | + `title-author-index` | + Validación completa duplicados |

## 🛠️ Comandos Útiles

### **Ver estado actual:**
```bash
npx cdk diff
```

### **Deploy específico:**
```bash
npx cdk deploy --require-approval never
```

### **Rollback si hay problemas:**
```bash
# Cambiar a fase anterior y deploy
deploymentPhase: 'phase2'
npx cdk deploy
```

## ⚠️ Consideraciones Importantes

### **Limitaciones de DynamoDB:**
- Solo 1 GSI por deployment
- Cada GSI toma 5-10 minutos en crear
- No se puede eliminar y crear GSI en el mismo deployment

### **Costos:**
- Cada GSI consume capacidad adicional
- En PAY_PER_REQUEST: Solo pagas por uso
- Monitorea costos en CloudWatch

### **Performance:**
- Más GSIs = más opciones de query
- Pero también más overhead en writes
- Evalúa si realmente necesitas todos

## 🎯 Recomendación

**Para tu caso de uso actual:**
1. **Mantente en Phase 2** si no necesitas validación automática
2. **Ve a Phase 3** si quieres validación por ISBN
3. **Ve a Phase 4** solo si necesitas validación completa

**Para producción:**
- Empieza con Phase 2
- Agrega Phase 3 cuando tengas muchos libros
- Phase 4 solo si es crítico evitar duplicados