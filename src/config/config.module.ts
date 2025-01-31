import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './database.config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config accessible globally
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    MongooseModule.forRoot(
      process.env.DB_MONGO_URL || 'mongodb://localhost:27017/job_board',
      {
        retryAttempts: 5, // Number of reconnection attempts
        retryDelay: 3000, // Delay between reconnection attempts
      },
    ),
  ],
})
export class ConfigAppModule {}
