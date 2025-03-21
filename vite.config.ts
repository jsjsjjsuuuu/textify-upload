
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
  
  // النطاقات المسموح بها للاتصال بالخادم بشكل دقيق
  const ALLOWED_ORIGINS = [
    'https://d6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovableproject.com',
    'https://d6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovable.app',
    'https://textify-upload.onrender.com',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  // تدوير عناوين IP الثابتة لـ Render
  const RENDER_IPS = [
    '44.226.145.213',
    '54.187.200.255',
    '34.213.214.55',
    '35.164.95.156',
    '44.230.95.183',
    '44.229.200.200'
  ];
  
  // دالة محسنة للتحقق من النطاق
  const isAllowedOrigin = (origin: string | undefined): boolean => {
    if (!origin) return false;
    
    console.log(`فحص صحة الأصل في vite.config.ts: ${origin}`);
    try {
      // استخراج الاسم الفعلي للنطاق
      const url = new URL(origin);
      const hostname = url.hostname;
      
      // استخراج النطاقات من العناوين الكاملة
      const allowedDomains = ALLOWED_ORIGINS.map(url => {
        try {
          return new URL(url).hostname;
        } catch {
          return url;
        }
      });
      
      // إضافة النطاقات الأساسية
      const baseDomains = ['lovable.app', 'lovableproject.com', 'textify-upload.onrender.com', 'localhost', '127.0.0.1'];
      baseDomains.forEach(domain => {
        if (!allowedDomains.includes(domain)) {
          allowedDomains.push(domain);
        }
      });
      
      // فحص مطابقة دقيقة للنطاق
      const exactMatch = allowedDomains.includes(hostname);
      
      // فحص النطاقات الفرعية للنطاقات المسموح بها
      const subdomainMatch = allowedDomains.some(domain => {
        if (domain === 'localhost' || domain === '127.0.0.1') {
          return hostname === domain;
        }
        return hostname.endsWith(`.${domain}`);
      });
      
      // تسجيل نتيجة الفحص للتشخيص
      console.log(`vite.config.ts - ${hostname}: مطابقة دقيقة: ${exactMatch}, نطاق فرعي: ${subdomainMatch}`);
      
      return exactMatch || subdomainMatch;
    } catch (error) {
      console.error('خطأ في تحليل الأصل:', error);
      return false;
    }
  };
  
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
      'process.env.VITE_AUTOMATION_SERVER_URL': JSON.stringify(automationServerUrl),
      'import.meta.env.VITE_ALLOWED_ORIGINS': JSON.stringify(ALLOWED_ORIGINS)
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
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('وقع خطأ في البروكسي:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('طلب البروكسي:', req.method, req.url);
              
              const selectedIp = getRandomIp();
              console.log(`استخدام عنوان IP للبروكسي: ${selectedIp}`);
              
              // الحصول على الأصل (origin) الفعلي من الطلب
              const origin = req.headers.origin || '';
              console.log(`الأصل (Origin) المرسل: ${origin}`);
              
              // استخدام الدالة المحسنة للتحقق من النطاق
              const isAllowed = isAllowedOrigin(origin);
              
              // أضف رؤوس CORS المخصصة
              if (isAllowed) {
                console.log(`النطاق مسموح به: ${origin}`);
                // إضافة الرؤوس اللازمة للتجاوز مشاكل CORS
                proxyReq.setHeader('X-Forwarded-For', selectedIp);
                proxyReq.setHeader('X-Render-Client-IP', selectedIp);
                proxyReq.setHeader('Origin', origin);
                proxyReq.setHeader('Referer', req.headers.referer || origin);
                
                // إضافة رؤوس دعم CORS أخرى
                proxyReq.setHeader('Accept', 'application/json');
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Access-Control-Allow-Origin', origin);
                proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Forwarded-For, X-Render-Client-IP, X-Client-ID, Cache-Control, Pragma, X-Request-Time, Origin, Referer');
                proxyReq.setHeader('Access-Control-Max-Age', '86400');
                proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
              } else {
                console.log(`النطاق غير مسموح به: ${origin}`);
                // في حالة النطاقات غير المسموح بها، لا نقوم بإضافة رؤوس CORS
              }
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('استجابة البروكسي:', proxyRes.statusCode, req.url);
              
              // الحصول على الأصل (origin) الفعلي من الطلب
              const origin = req.headers.origin || '';
              
              // استخدام الدالة المحسنة للتحقق من النطاق
              const isAllowed = isAllowedOrigin(origin);
              
              if (isAllowed) {
                // تعديل رؤوس الاستجابة لتسهيل الاتصال
                proxyRes.headers['access-control-allow-origin'] = origin;
                proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
                proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With, X-Forwarded-For, X-Render-Client-IP, X-Client-ID, Cache-Control, Pragma, X-Request-Time, Origin, Referer';
                proxyRes.headers['access-control-allow-credentials'] = 'true';
              } else {
                // إزالة أي رؤوس CORS موجودة للأصول غير المسموح بها
                delete proxyRes.headers['access-control-allow-origin'];
                delete proxyRes.headers['access-control-allow-methods'];
                delete proxyRes.headers['access-control-allow-headers'];
                delete proxyRes.headers['access-control-allow-credentials'];
              }
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
