// multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads', // Directory where files will be stored
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExt = extname(file.originalname);
      const fileName = `${file.fieldname}-${uniqueSuffix}${fileExt}`;
      callback(null, fileName);
    },
  }),

  
};

export const fileFilter = (req, file, callback) => {
  // Allow only image files
  if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
    return callback(new Error('Only image files are allowed'), false);
  }
  callback(null, true);
};


