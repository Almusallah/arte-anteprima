import {defineConfig} from 'vite';
import {resolve} from 'node:path';
const input={home:resolve('index.html'),lab:resolve('lab/index.html')};
export default defineConfig({build:{rollupOptions:{input}}});
