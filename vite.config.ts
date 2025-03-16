
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // الحصول على عنوان خادم الأتمتة من المتغيرات البيئية أو استخدام الافتراضي
  const automationServerUrl = process.env.AUTOMATION_SERVER_URL || 'http://localhost:3001';
  
  return {
    server: {
      host: "::",
      port: 8080, // استخدام المنفذ 8080 بشكل ثابت للتطوير المحلي
      proxy: {
        // إعادة توجيه طلبات API الأتمتة للخادم المناسب
        '/api': {
          target: automationServerUrl,
          changeOrigin: true,
        }
      }
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // إضافة تكوين النشر
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          }
        }
      }
    },
  };
});
