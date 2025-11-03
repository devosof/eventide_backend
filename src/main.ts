import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


 
  app.enableCors({
    origin: 'http://localhost:5174', // your frontend URL
    credentials: true, // needed for cookies
  });
   app.use(cookieParser());


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
