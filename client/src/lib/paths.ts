import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const distPath = path.resolve(path.dirname(__filename), '../../../dist');
const rootPath = path.resolve(path.dirname(__filename), '../../..');
const srcPath = path.resolve(rootPath, 'client/src');
const sharedPath = path.resolve(rootPath, 'shared');
const assetsPath = path.resolve(rootPath, 'attached_assets');

export const paths = {
  root: rootPath,
  src: srcPath,
  dist: distPath,
  shared: sharedPath,
  assets: assetsPath,
} as const;
