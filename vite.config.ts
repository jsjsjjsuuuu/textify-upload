
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // استخدام خادم Render كمنفذ افتراضي لخادم الأتمتة
  const automationServerUrl = 'https://textify-upload.onrender.com';
  
  console.log(`⚡️ الاتصال بخادم الأتمتة على: ${automationServerUrl}`);
  
  return {
    server: {
      host: "::",
      port: 8080, // استخدام المنفذ 8080 بشكل ثابت للتطوير المحلي
      proxy: {
        // إعادة توجيه طلبات API الأتمتة للخادم المناسب
        '/api': {
          target: automationServerUrl,
          changeOrigin: true,
          secure: false, // السماح بالاتصالات غير الآمنة (هام للتطوير)
          ws: true, // دعم WebSockets
          rewrite: (path) => path,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Forwarded-For, X-Render-Client-IP',
            'X-Forwarded-For': '44.226.145.213',
            'X-Render-Client-IP': '44.226.145.213'
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('وقع خطأ في البروكسي:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('طلب البروكسي:', req.method, req.url);
              // إضافة رؤوس IP ثابتة للتواصل مع Render
              proxyReq.setHeader('X-Forwarded-For', '44.226.145.213');
              proxyReq.setHeader('X-Render-Client-IP', '44.226.145.213');
              // إضافة رؤوس إضافية لتجنب مشاكل CORS
              proxyReq.setHeader('Origin', 'https://textify-upload.onrender.com');
              proxyReq.setHeader('Referer', 'https://textify-upload.onrender.com');
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('استجابة البروكسي:', proxyRes.statusCode, req.url);
            });
          }
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
