// Resolver para obtener un libro por ID
import { util } from '@aws-appsync/utils';
import { get } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
    console.log('GetBook Request iniciado');
    console.log('Args:', JSON.stringify(ctx.args));
    
    const id = ctx.args.id;
    
    // Validación básica
    if (!id) {
        util.error('Book ID is required', 'ValidationError');
    }
    
    return get({
        key: { id: id }
    });
}

export function response(ctx) {
    console.log('GetBook Response iniciado');
    
    const { error, result } = ctx;
    
    if (error) {
        console.error('Error:', error.message);
        return util.error(error.message, error.type);
    }
    
    // Si no se encuentra el libro, retornar null
    if (!result) {
        console.log('Libro no encontrado');
        return null;
    }
    
    console.log('Libro encontrado:', JSON.stringify(result));
    return result;
}