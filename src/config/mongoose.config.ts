import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';

export const getMongoConfig = async (
  configService: ConfigService,
): Promise<MongooseModuleOptions> => {
  const logger = new Logger('MongoDB');
  
  // Check if we're generating swagger
  const isGeneratingSwagger = process.argv.includes('src/swagger-generator.ts');
  
  if (isGeneratingSwagger) {
    logger.log('Swagger generation detected - using mock MongoDB connection');
    return {
      uri: 'mongodb://mock:27017/mock',
      connectionFactory: (connection) => connection,
    };
  }

  return {
    uri: configService.get<string>('MONGODB_URI'),
    connectionFactory: (connection) => {
      connection.on('connected', () => {
        logger.log('MongoDB connected successfully');
      });
      
      connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });
      
      connection.on('error', (error) => {
        logger.error('MongoDB connection error', error.stack);
      });
      
      return connection;
    }
  };
}; 