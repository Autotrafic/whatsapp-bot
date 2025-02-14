import { Request } from 'express';

interface SendMediaRequest extends Request {
  files: Express.Multer.File[];
  body: {
    chatId: string;
    message?: string;
  };
}

interface MediaFile {
  base64Data?: string;
  filename: string;
  mimetype: string;
}
