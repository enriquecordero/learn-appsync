import * as cdk from 'aws-cdk-lib';
import * as db from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface BooksTableProps {
  /**
   * Nombre personalizado para la tabla (opcional)
   */
  tableName?: string;
  
  /**
   * Política de eliminación (opcional, por defecto DESTROY)
   */
  removalPolicy?: cdk.RemovalPolicy;

  /**
   * Fase de deployment para GSIs (permite deployments incrementales)
   * phase1: Solo tabla base + author-index
   * phase2: + publisher-index  
   * phase3: + isbn-index
   * phase4: + title-author-index
   */
  deploymentPhase?: 'phase1' | 'phase2' | 'phase3' | 'phase4';
}

export class BooksTable extends Construct {
  public readonly table: db.Table;

  constructor(scope: Construct, id: string, props?: BooksTableProps) {
    super(scope, id);

    const phase = props?.deploymentPhase || 'phase2'; // Por defecto phase2 (estado actual)

    // Crear la tabla principal con partition key 'id'
    this.table = new db.Table(this, 'BooksTable-CDK', {
      partitionKey: { 
        name: 'id', 
        type: db.AttributeType.STRING 
      },
      billingMode: db.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props?.removalPolicy || cdk.RemovalPolicy.DESTROY,
      tableName: props?.tableName,
    });

    // ========== PHASE 1: Tabla base + Author Index ==========
    if (phase === 'phase1' || phase === 'phase2' || phase === 'phase3' || phase === 'phase4') {
      this.table.addGlobalSecondaryIndex({
        indexName: 'author-index',
        partitionKey: { 
          name: 'authorId', 
          type: db.AttributeType.STRING 
        }
      });
    }

    // ========== PHASE 2: + Publisher Index ==========
    if (phase === 'phase2' || phase === 'phase3' || phase === 'phase4') {
      this.table.addGlobalSecondaryIndex({
        indexName: 'publisher-index',
        partitionKey: { 
          name: 'publisherId', 
          type: db.AttributeType.STRING 
        }
      });
    }

    // ========== PHASE 3: + ISBN Index (para validación de duplicados) ==========
    if (phase === 'phase3' || phase === 'phase4') {
      this.table.addGlobalSecondaryIndex({
        indexName: 'isbn-index',
        partitionKey: { 
          name: 'isbn', 
          type: db.AttributeType.STRING 
        }
      });
    }

    // ========== PHASE 4: + Title-Author Index (para validación de duplicados sin ISBN) ==========
    if (phase === 'phase4') {
      this.table.addGlobalSecondaryIndex({
        indexName: 'title-author-index',
        partitionKey: { 
          name: 'titleAuthorKey', 
          type: db.AttributeType.STRING 
        }
      });
    }

    // Outputs para debugging
    new cdk.CfnOutput(scope, `BooksTable-Phase-${phase}`, {
      value: `Deployment Phase: ${phase}`,
      description: `Current deployment phase for BooksTable GSIs`
    });
  }

  /**
   * Método helper para generar la clave título-autor
   */
  public static generateTitleAuthorKey(title: string, authorId: string): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanAuthor = authorId.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanTitle}#${cleanAuthor}`;
  }
}