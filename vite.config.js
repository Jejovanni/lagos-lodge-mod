import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        outDir: 'public/injector',
        emptyOutDir: false,
        rollupOptions: {
            input: resolve(__dirname, 'src/injector/main.js'),
            output: {
                entryFileNames: 'loader.js',
            },
        },
    },
});