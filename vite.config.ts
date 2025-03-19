
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // استخدام خادم Render فقط حتى في بيئة التطوير
  const automationServerUrl = 'https://textify-upload.onrender.com';
  
  console.log(`⚡️ الاتصال بخادم الأتمتة على: ${automationServerUrl}, isProduction: ${mode === 'production'}`);
  console.log(`⚡️ تم تعيين استخدام خادم Render الرسمي فقط`);
  
  // تدوير عناوين IP الثابتة لـ Render
  const RENDER_IPS = [
    '34.106.88.0',
    '34.94.46.128',
    '34.82.138.64',
    '34.106.239.128',
    '34.106.102.192',
    '34.106.40.64',
    '34.82.189.128',
    '35.188.224.192'
  ];
  
  // اختيار عنوان IP عشوائي من القائمة
  const getRandomIp = () => {
    const randomIndex = Math.floor(Math.random() * RENDER_IPS.length);
    return RENDER_IPS[randomIndex];
  };
    
  return {
    define: {
      // تعريف متغيرات البيئة بالطريقة الصحيحة - مهم جدًا للواجهة الأمامية
      'import.meta.env.VITE_AUTOMATION_SERVER_URL': JSON.stringify(automationServerUrl),
      'process.env.AUTOMATION_SERVER_URL': JSON.stringify(automationServerUrl),
      'process.env.VITE_AUTOMATION_SERVER_URL': JSON.stringify(automationServerUrl)
    },
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: automationServerUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('وقع خطأ في البروكسي:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('طلب البروكسي:', req.method, req.url);
              
              const selectedIp = getRandomIp();
              console.log(`استخدام عنوان IP للبروكسي: ${selectedIp}`);
              
              proxyReq.setHeader('X-Forwarded-For', selectedIp);
              proxyReq.setHeader('X-Render-Client-IP', selectedIp);
              proxyReq.setHeader('Origin', automationServerUrl);
              proxyReq.setHeader('Referer', automationServerUrl);
              
              proxyReq.setHeader('Accept', 'application/json');
              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Access-Control-Allow-Origin', '*');
              proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
              proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
              proxyReq.setHeader('Access-Control-Max-Age', '86400');
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('استجابة البروكسي:', proxyRes.statusCode, req.url);
              
              proxyRes.headers['Access-Control-Allow-Origin'] = '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
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
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          }
        }
      },
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    }
  };
});
