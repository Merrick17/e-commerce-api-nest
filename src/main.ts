import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded, static as expressStatic } from 'express';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    logger.log('Application instance created');
    
    // Increase body parser limits
    app.use(json({ 
      limit: '50mb',
      verify: (req: any, res, buf, encoding) => {
        req.rawBody = buf;
      }
    }));
    logger.log('JSON body parser configured');
    
    app.use(urlencoded({ 
      limit: '50mb', 
      extended: true,
      parameterLimit: 100000,
    }));

    // Add global timeout middleware with response check
    app.use((req, res, next) => {
      // Set timeout to 5 minutes
      const timeoutId = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({
            message: 'Request Timeout',
            errors: {
              timeout: ['Upload took too long. Please try again.']
            }
          });
        }
      }, 5 * 60 * 1000);

      // Clear timeout when response is sent
      res.on('finish', () => {
        clearTimeout(timeoutId);
      });

      next();
    });

    // Add specific timeout for file uploads
    app.use('/products', (req, res, next) => {
      if (req.method === 'POST') {
        // Set timeout to 10 minutes for product uploads
        const uploadTimeoutId = setTimeout(() => {
          if (!res.headersSent) {
            res.status(408).json({
              message: 'Upload Timeout',
              errors: {
                timeout: ['File upload took too long. Please try again with a smaller file or check your connection.']
              }
            });
          }
        }, 10 * 60 * 1000);

        // Clear timeout when response is sent
        res.on('finish', () => {
          clearTimeout(uploadTimeoutId);
        });
      }
      next();
    });

    // Enable CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*', // You can specify allowed origins or use '*' for all
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // Validation pipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
    }));

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription('The E-commerce API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Serve static files
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });

    // Add request logging middleware
    app.use((req, res, next) => {
      const requestLogger = new Logger('HTTP');
      const start = Date.now();

      requestLogger.log(`Incoming ${req.method} request to ${req.url}`);

      res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.url} ${res.statusCode} ${duration}ms`;
        
        if (res.statusCode >= 500) {
          requestLogger.error(message);
        } else if (res.statusCode >= 400) {
          requestLogger.warn(message);
        } else {
          requestLogger.log(message);
        }
      });

      next();
    });

    app.use('/uploads', expressStatic('uploads'));

    await app.listen(process.env.PORT ?? 3000);
    logger.log(`Application is running on port ${process.env.PORT ?? 3000}`);
  } catch (error) {
    logger.error('Failed to start application', error.stack);
    process.exit(1);
  }
}
bootstrap();
