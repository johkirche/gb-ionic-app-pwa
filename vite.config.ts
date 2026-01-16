/// <reference types="vitest" />
import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), legacy(), vueDevTools()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        exclude: ['@directus/sdk'],
    },
    build: {
        // Enable minification
        minify: 'terser',
        // Terser options for advanced minification and obfuscation
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
                drop_debugger: true, // Remove debugger statements
                pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific functions
                passes: 2, // Run compress twice for better optimization
            },
            mangle: {
                // Enable name mangling (obfuscation)
                toplevel: true,
                safari10: true,
                // Properties to keep readable (adjust as needed)
                reserved: ['$', 'exports', 'require'],
            },
            format: {
                comments: false, // Remove all comments
                ecma: 2020,
            },
        },
        // Source maps (disable in production for better security)
        sourcemap: process.env.NODE_ENV !== 'production' ? 'inline' : false,
        // Chunk size optimization
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Manual chunk splitting for better caching
                manualChunks: {
                    'vue-vendor': ['vue', 'vue-router', 'pinia'],
                    'ionic-vendor': ['@ionic/vue', '@ionic/vue-router', 'ionicons'],
                    'directus-vendor': ['@directus/sdk'],
                    'abcjs-vendor': ['abcjs'],
                },
                // Obfuscate chunk names
                chunkFileNames: (chunkInfo) => {
                    const facadeModuleId = chunkInfo.facadeModuleId
                        ? chunkInfo.facadeModuleId.split('/').pop()
                        : 'chunk';
                    return `assets/[name]-[hash].js`;
                },
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        // CSS minification
        cssMinify: true,
        // Target modern browsers
        target: 'es2020',
        // Optimize bundle size
        reportCompressedSize: true,
        // Polyfills
        modulePreload: {
            polyfill: true,
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
    },
});
