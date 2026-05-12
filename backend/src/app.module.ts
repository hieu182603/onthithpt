import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GatewayModule } from './gateway/gateway.module';
import { SeederModule } from './common/seeder/seeder.module';
import { SmartReviewModule } from './common/smart-review/smart-review.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { ImportModule } from './common/import/import.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TopicsModule } from './topics/topics.module';
import { QuestionsModule } from './questions/questions.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // ═══════════════════════════════════════════
    // ⚙️ Config (.env)
    // ═══════════════════════════════════════════
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ═══════════════════════════════════════════
    // 🗄️ Database (PostgreSQL + TypeORM)
    // ═══════════════════════════════════════════
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // ⚠️ Chỉ dùng true ở môi trường DEV
        logging: false,
      }),
    }),

    // ═══════════════════════════════════════════
    // 🔴 Redis Cache
    // ═══════════════════════════════════════════
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: 'memory', // Tạm dùng memory, đổi sang Redis khi cài Redis server
        ttl: 60, // Cache mặc định 60 giây
        // Khi có Redis server, uncomment dòng dưới:
        // store: redisStore,
        // host: configService.get('REDIS_HOST'),
        // port: configService.get('REDIS_PORT'),
      }),
    }),

    // ═══════════════════════════════════════════
    // 📦 Feature Modules
    // ═══════════════════════════════════════════
    UsersModule,
    AuthModule,
    NotificationsModule,
    SubjectsModule,
    TopicsModule,
    QuestionsModule,
    QuizzesModule,
    GatewayModule,
    SeederModule,
    SmartReviewModule,
    CloudinaryModule,
    ImportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
