import { unlink } from 'fs';
import path from 'path';

export function cleanupFiles(files: any[]) {
  files.forEach((file) => {
    const filePath = path.join('uploads/', file.filename);
    unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${filePath}`, err);
      } else {
        console.log(`File deleted: ${filePath}`);
      }
    });
  });
}
