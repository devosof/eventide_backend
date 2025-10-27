import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.use(cookieParser());
  app.enableCors({
    origin: '*', // your frontend URL
    credentials: true, // needed for cookies
  });

  // If we want to use the validation globally on all the routes.
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //   }),
  // );
  await app.listen(3000);
  // console.log(process.env.DATABASE_URL);
}
bootstrap();
