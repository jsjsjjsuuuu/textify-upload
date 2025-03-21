
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
  
  // النطاقات المسموح بها للاتصال بالخادم بشكل دقيق - توسيع القائمة
  const ALLOWED_ORIGINS = [
    // نطاقات Lovable
    'https://d6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovableproject.com',
    'https://d6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovable.app',
    'https://lovable.app',
    'https://lovableproject.com',
    // جميع النطاقات الفرعية لـ lovable
    '*.lovable.app',
    '*.lovableproject.com',
    // خوادم التطوير
    'https://textify-upload.onrender.com',
    'https://textify-web.onrender.com',
    'https://render.com',
    '*.render.com',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    // السماح بنطاقات localhost المتنوعة
    'localhost:*',
    '127.0.0.1:*',
    // نطاقات أخرى
    'https://gemini.google.com',
    '*.google.com',
    '*.googleapis.com',
    '*.cloudflare.com',
    // إضافة نطاقات إضافية لتجنب مشاكل CORS من المستخدمين
    '*'  // السماح بالوصول من أي نطاق
  ];
  
  // تدوير عناوين IP الثابتة لـ Render
  const RENDER_IPS = [
    '44.226.145.213',
    '54.187.200.255',
    '34.213.214.55',
    '35.164.95.156',
    '44.230.95.183',
    '44.229.200.200',
    // إضافة المزيد من عناوين IP للتناوب
    '44.242.143.234',
    '54.244.142.219',
    '44.241.75.25',
    '44.236.246.209',
    '52.27.36.56'
  ];
  
  // دالة محسنة للتحقق من النطاق
  const isAllowedOrigin = (origin: string | undefined): boolean => {
    // في حالة عدم وجود origin
    if (!origin) return true; // السماح بالطلبات بدون أصل

    try {
      console.log(`فحص صحة الأصل في vite.config.ts: ${origin}`);
      
      // استخراج الاسم الفعلي للنطاق
      const url = new URL(origin);
      const hostname = url.hostname;
      
      // في بيئة التطوير، السماح بجميع الأصول
      if (mode === 'development') {
        console.log('في بيئة التطوير - السماح بالنطاق: ', hostname);
        return true;
      }
      
      // معالجة النطاقات الخاصة
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('السماح بنطاق محلي: ', hostname);
        return true;
      }
      
      // فحص القائمة السوداء بدلاً من القائمة البيضاء - لنكون أكثر تساهلاً
      const blockedDomains = ['evil.com']; // يمكن ترك هذه القائمة فارغة
      
      if (blockedDomains.some(domain => hostname.includes(domain))) {
        console.log(`النطاق محظور: ${hostname}`);
        return false;
      }
      
      // السماح بكل النطاقات الأخرى - نهج أكثر تساهلاً بدلاً من الحظر
      console.log(`السماح بالنطاق: ${hostname}`);
      return true;
    } catch (error) {
      console.error('خطأ في تحليل الأصل:', error);
      return true; // السماح في حالة وجود خطأ لتجنب مشاكل CORS
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
      'import.meta.env.VITE_ALLOWED_ORIGINS': JSON.stringify(ALLOWED_ORIGINS),
      // إضافة معلومات جديدة - تفعيل وضع الإنتاج دائمًا
      'import.meta.env.VITE_FORCE_PRODUCTION': JSON.stringify(true),
      'process.env.FORCE_PRODUCTION': JSON.stringify(true),
      // إضافة متغيرات بيئة جديدة لمعالجة CORS
      'import.meta.env.VITE_DISABLE_CORS': JSON.stringify(true),
      'process.env.DISABLE_CORS': JSON.stringify(true)
    },
    server: {
      host: "::",
      port: 8080,
      cors: {
        origin: '*', // السماح بالاتصال من أي نطاق في بيئة التطوير
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Content-Type-Options', 
                         'X-Forwarded-For', 'X-Client-ID', 'Cache-Control', 'Pragma', 'X-Request-Time', 
                         'Origin', 'Referer', 'User-Agent', 'Access-Control-Request-Method', 
                         'Access-Control-Request-Headers', 'X-Debug-Mode', 'X-Retry-Count', 'X-Client-Timestamp'],
        exposedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Debug-Mode'],
        credentials: true,
        maxAge: 86400, // زيادة وقت تخزين استجابات preflight لمدة يوم كامل
        preflightContinue: true // السماح بمتابعة طلبات preflight
      },
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
              
              // الحصول على الأصل (origin) الفعلي من الطلب
              const origin = req.headers.origin || '';
              console.log(`الأصل (Origin) المرسل: ${origin}`);
              
              // إضافة هويات الطلب
              const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              // أضف رؤوس CORS المخصصة - دائما إضافة الرؤوس المهمة
              proxyReq.setHeader('X-Forwarded-For', selectedIp);
              proxyReq.setHeader('X-Render-Client-IP', selectedIp);
              proxyReq.setHeader('Origin', origin || automationServerUrl);
              proxyReq.setHeader('Referer', req.headers.referer || origin || automationServerUrl);
              proxyReq.setHeader('X-Request-ID', requestId);
              proxyReq.setHeader('X-Debug-Mode', 'true');
              
              // إضافة رؤوس دعم CORS دائمًا
              proxyReq.setHeader('Accept', '*/*');
              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Access-Control-Allow-Origin', '*');
              proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
              proxyReq.setHeader('Access-Control-Allow-Headers', '*');
              proxyReq.setHeader('Access-Control-Max-Age', '86400');
              proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
              proxyReq.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization, Content-Length, X-Debug-Mode');
            });
            
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('استجابة البروكسي:', proxyRes.statusCode, req.url);
              
              // الحصول على الأصل (origin) الفعلي من الطلب
              const origin = req.headers.origin || '';
              
              // تعديل رؤوس الاستجابة لتسهيل الاتصال - دائمًا إضافة الرؤوس المهمة
              proxyRes.headers['access-control-allow-origin'] = '*';
              proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH';
              proxyRes.headers['access-control-allow-headers'] = '*';
              proxyRes.headers['access-control-allow-credentials'] = 'true';
              proxyRes.headers['access-control-max-age'] = '86400';
              proxyRes.headers['access-control-expose-headers'] = 'Content-Type, Authorization, Content-Length, X-Debug-Mode';
              
              // إضافة رؤوس أمان إضافية
              proxyRes.headers['x-content-type-options'] = 'nosniff';
              proxyRes.headers['x-xss-protection'] = '1; mode=block';
              
              // ضمان عدم وجود قيود على الاتصال
              delete proxyRes.headers['content-security-policy'];
              delete proxyRes.headers['x-frame-options'];
              
              // إضافة توقيت الاستجابة للمساعدة في التصحيح
              proxyRes.headers['x-response-time'] = Date.now().toString();
              proxyRes.headers['x-proxy-status'] = 'success';
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
