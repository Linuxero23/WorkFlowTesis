import dotenv from 'dotenv';
import path from 'node:path';

const backendRoot = path.resolve(__dirname, '../..');

dotenv.config({
  path: path.join(backendRoot, '.env'),
  override: false,
});
