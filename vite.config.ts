import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@fullcalendar')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-query-table';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('framer-motion') || id.includes('recharts')) {
              return 'vendor-ui';
            }
            if (id.includes('papaparse')) {
              return 'vendor-papaparse';
            }
            if (id.includes('exceljs')) {
              return 'vendor-exceljs';
            }
          }

          if (id.includes('/src/features/scheduling/')) {
            return 'feature-scheduling';
          }
          if (id.includes('/src/features/buildings/')) {
            return 'feature-buildings';
          }
          if (id.includes('/src/features/management/')) {
            return 'feature-management';
          }
          if (id.includes('/src/features/services/')) {
            return 'feature-services';
          }
        }
      }
    }
  }
});
