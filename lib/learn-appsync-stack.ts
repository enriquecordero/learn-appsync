import * as cdk from 'aws-cdk-lib';
import { AuthorizationType, Definition, FieldLogLevel, GraphqlApi, IntrospectionConfig, MappingTemplate, Visibility } from 'aws-cdk-lib/aws-appsync';
import { Construct } from 'constructs';
import { BooksTable } from './constructs/tables/dynamoDb';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LearnAppsyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========== TABLA DYNAMODB ==========
    const booksTable = new BooksTable(this, 'BooksTable', {
      tableName: 'Books',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deploymentPhase: 'phase4' // Todos los índices disponibles
    });

    const coreAPI = new GraphqlApi(this, "BookApi", {
          // ========== CONFIGURACIÓN BÁSICA ==========
      name: "BookAPI",
      definition: Definition.fromFile("graphql/schema.graphql"),
        // ========== CONFIGURACIÓN DE AUTORIZACIÓN ==========
      authorizationConfig:{
        defaultAuthorization:{
          authorizationType: AuthorizationType.API_KEY
        }
      },
      // ========== CONFIGURACIÓN DE LOGGING ==========
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL, // ALL, ERROR, NONE
        excludeVerboseContent: false, // Incluir contenido detallado en logs
      },

      // ========== CONFIGURACIÓN DE TRACING ==========
      xrayEnabled: true, // AWS X-Ray tracing habilitado

      // ========== CONFIGURACIÓN DE VISIBILIDAD ==========
      visibility: Visibility.GLOBAL, // GLOBAL (público) o PRIVATE

      // ========== CONFIGURACIÓN DE INTROSPECCIÓN ==========
      introspectionConfig: IntrospectionConfig.ENABLED, // Habilita introspección
    });

    // Hacer la tabla accesible desde el API
    const DSBook = coreAPI.addDynamoDbDataSource('BooksDataSource', booksTable.table);

    // ========== RESOLVER VTL CON VALIDACIÓN DE DUPLICADOS USANDO CONDITIONAL WRITES ==========
    DSBook.createResolver('CreateBookVTLResolver', {
      typeName: 'Mutation',
      fieldName: 'createBook',
      requestMappingTemplate: MappingTemplate.fromFile('resolvers/vtl/createBook.req.vtl'),
      responseMappingTemplate: MappingTemplate.fromFile('resolvers/vtl/createBook.res.vtl'),
    });

    // ========== RESOLVERS JAVASCRIPT PARA QUERIES ==========
    DSBook.createResolver('GetBookJSResolver', {
      typeName: 'Query',
      fieldName: 'getBook',
      code: cdk.aws_appsync.Code.fromAsset('resolvers/javascript/books/getBook.js'),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });

    DSBook.createResolver('ListBooksJSResolver', {
      typeName: 'Query',
      fieldName: 'listBooks',
      code: cdk.aws_appsync.Code.fromAsset('resolvers/javascript/books/listBooks.js'),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });

    // ========== OUTPUTS PARA FÁCIL ACCESO ==========
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: coreAPI.graphqlUrl,
      description: 'URL del GraphQL API'
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: coreAPI.apiKey || 'No API Key generated',
      description: 'API Key para autenticación'
    });

    new cdk.CfnOutput(this, 'GraphQLAPIId', {
      value: coreAPI.apiId,
      description: 'ID del GraphQL API'
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: booksTable.table.tableName,
      description: 'Nombre de la tabla DynamoDB'
    });
  }
}
