import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001', "threadly-website.vercel.app"],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],

  });

  app.useGlobalPipes(new ZodValidationPipe());

  // const config = new DocumentBuilder()
  //   .setTitle('Threadly')
  //   .setDescription('Threadly description')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .build();

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
