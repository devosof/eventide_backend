import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // app.useStaticAssets(join(__dirname, '..', 'uploads'));


 
  app.enableCors({
    origin: 'http://localhost:5173', // your frontend URL
    credentials: true, // needed for cookies
  });
   app.use(cookieParser());

   // Serve static assets
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: "/uploads/", // for global directory like /backend/aladin/uploads
  });

  console.log('Serving uploads from:', join(process.cwd(), 'uploads'));



  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle("Eventide API")
    .setDescription("API for the eventide event management platform")
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document);



  // If we want to use the validation globally on all the routes.
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //   }),
  // );
  await app.listen(3000);
  // console.log(process.env.DATABASE_URL);
  console.log(`Server running on localhost:3000`)
  console.log("Swagger docs available at localhost:3000/api")
}
bootstrap();
