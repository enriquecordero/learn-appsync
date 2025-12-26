// Resolver para listar todos los libros
import { util } from '@aws-appsync/utils';
import { scan } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
    console.log('ListBooks Request iniciado');
    console.log('Args:', JSON.stringify(ctx.args));
    
    // Usar scan para obtener todos los libros
    // En producción, considera usar paginación con limit y nextToken
    return scan({
        // Opcional: agregar filtros o límites
        // limit: 50,
        // filter: { ... }
    });
}

export function response(ctx) {
    console.log('ListBooks Response iniciado');
    
    const { error, result } = ctx;
    
    if (error) {
        console.error('Error:', error.message);
        return util.error(error.message, error.type);
    }
    
    // result.items contiene la lista de libros
    const books = result.items || [];
    
    console.log(`Libros encontrados: ${books.length}`);
    console.log('Libros:', JSON.stringify(books));
    
    return books;
}