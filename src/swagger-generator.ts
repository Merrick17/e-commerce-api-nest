import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

async function generateSwaggerJson() {
  const logger = new Logger('SwaggerGenerator');
  
  try {
    // Create the app with database disabled for swagger generation
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });

    // Create Swagger config
    const config = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription('The E-commerce API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('products', 'Product management endpoints')
      .addTag('categories', 'Category management endpoints')
      .addTag('orders', 'Order management endpoints')
      .addTag('promo-codes', 'Promo code management endpoints')
      .addTag('promotions', 'Promotion management endpoints')
      .addTag('statistics', 'Statistics endpoints')
      .addTag('store-config', 'Store configuration endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Ensure the docs directory exists
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir);
    }

    // Write the Swagger JSON file
    fs.writeFileSync(
      path.join(docsDir, 'swagger.json'),
      JSON.stringify(document, null, 2),
    );

    logger.log('Swagger JSON file generated successfully');
    await app.close();
  } catch (error) {
    logger.error('Failed to generate Swagger JSON file', error.stack);
    process.exit(1);
  }
}

generateSwaggerJson(); 