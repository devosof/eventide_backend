import { BadRequestException, Injectable } from '@nestjs/common';
import path, { join } from 'path';

@Injectable()
export class UploadService {
  handleSingle(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File not found');
    }
    console.log(`File ${file.filename} received`);
    

    const imageUrl = `localhost:3000/uploads/${file.filename}`;

    return { file, imageUrl: imageUrl };
  }

  uploadMany(files: Express.Multer.File[]) {
    if (!files || !Array.isArray(files)) {
      throw new BadRequestException('File(s) not found');
    }

    let uploadedFiles: string[] = []
    for (const newFile of files){
        const url = `localhost:3000/uploads/${newFile.filename}`
        uploadedFiles.push(url)
    }

    return uploadedFiles

  }

  getFilePath(filename: string): string {
    return join(process.cwd(), 'uploads', filename);
  }

  getPublicFilePath(filename: string): string {
    return `/uploads/${filename}`;
  }
}
