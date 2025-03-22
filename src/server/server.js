
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// تحويل __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تهيئة المتغيرات البيئية
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// تحسين اكتشاف URL الخادم - تجربة جميع المصادر المحتملة
const AUTOMATION_SERVER_URL = process.env.VITE_AUTOMATION_SERVER_URL || 
                             process.env.AUTOMATION_SERVER_URL || 
                             process.env.RENDER_EXTERNAL_URL || 
                             process.env.RAILWAY_PUBLIC_DOMAIN || 
                             (process.env.HEROKU_APP_NAME && `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`) || 
                             `http://localhost:${PORT}`;

console.log('تهيئة خادم الأتمتة...');
console.log(`NODE_ENV: ${NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`AUTOMATION_SERVER_URL: ${AUTOMATION_SERVER_URL}`);
console.log(`VITE_AUTOMATION_SERVER_URL: ${process.env.VITE_AUTOMATION_SERVER_URL || 'not set'}`);
console.log(`RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL || 'not set'}`);

const app = express();

// تحديد قائمة النطاقات المسموح بها بشكل دقيق
const ALLOWED_DOMAINS = [
  'lovable.app',
  'lovableproject.com',
  'd6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovableproject.com',
  'd6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovable.app',
  'textify-upload.onrender.com',
  'localhost',
  '127.0.0.1'
];

// دالة محسنة للتحقق من النطاق
const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  
  // نطبع دائمًا الأصل للتشخيص
  console.log(`فحص الأصل: ${origin}`);
  
  try {
    // استخراج الاسم الفعلي للنطاق
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // فحص مطابقة دقيقة للنطاق
    const exactMatch = ALLOWED_DOMAINS.includes(hostname);
    
    // فحص النطاقات الفرعية للنطاقات المسموح بها
    const subdomainMatch = ALLOWED_DOMAINS.some(domain => {
      // لا نقبل المقارنات الجزئية، بل التحقق من أن النطاق الفرعي ينتهي بالنطاق الرئيسي
      return hostname.endsWith(`.${domain}`) || hostname === domain;
    });
    
    // تسجيل نتيجة الفحص للتشخيص
    console.log(`${hostname}: نطاق مطابق بالضبط: ${exactMatch}, نطاق فرعي: ${subdomainMatch}`);
    
    return exactMatch || subdomainMatch;
  } catch (error) {
    console.error('خطأ في تحليل الأصل:', error);
    return false;
  }
};

// إضافة middleware
app.use(cors({
  origin: function(origin, callback) {
    // السماح بالطلبات بدون أصل (مثل تطبيقات الجوال أو curl أو Postman)
    if (!origin) return callback(null, true);
    
    // التحقق من النطاق باستخدام الدالة المحسنة
    const isAllowed = isAllowedOrigin(origin);
    
    if (isAllowed) {
      console.log('CORS: قبول الطلب من الأصل:', origin);
      return callback(null, true);
    }
    
    console.log('CORS: رفض الطلب من الأصل غير المسموح به:', origin);
    callback(new Error('CORS policy violation: Origin not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Forwarded-For', 
    'X-Render-Client-IP',
    'X-Client-ID',
    'Cache-Control',
    'Pragma',
    'X-Request-Time',
    'Origin',
    'Referer'
  ],
  credentials: true,
  maxAge: 86400,
  exposedHeaders: ['Access-Control-Allow-Origin']
}));
app.use(express.json({ limit: '50mb' }));

// دالة مساعدة محسنة للتعامل مع رؤوس CORS
const setCorsHeaders = (req, res) => {
  const origin = req.get('origin');
  if (origin) {
    // استخدام نفس دالة التحقق من النطاق
    const isAllowed = isAllowedOrigin(origin);
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log(`تعيين رأس Access-Control-Allow-Origin إلى: ${origin}`);
    } else {
      // عدم تعيين رأس CORS للأصول غير المسموح بها
      console.log(`رفض تعيين رأس CORS للأصل غير المسموح به: ${origin}`);
      return false;
    }
  } else {
    // يمكننا استخدام * لطلبات بدون أصل، أو تحديد نطاق محدد
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // تعيين الرؤوس الأخرى
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Forwarded-For, X-Render-Client-IP, X-Client-ID, Cache-Control, Pragma, X-Request-Time, Origin, Referer');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return true;
};

// إضافة معالج خاص لطلبات OPTIONS لضمان استجابات CORS الصحيحة
app.options('*', (req, res) => {
  console.log('OPTIONS request received:', {
    path: req.path,
    headers: req.headers,
    origin: req.get('origin')
  });
  
  // التحقق من النطاق المسموح به قبل تعيين الرؤوس
  if (setCorsHeaders(req, res)) {
    res.status(200).end();
  } else {
    // رفض الطلب إذا كان الأصل غير مسموح به
    res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
  }
});

// إضافة نقطة نهاية بسيطة للتحقق السريع من الاتصال
app.get('/api/ping', (req, res) => {
  // تسجيل معلومات الطلب للتشخيص
  console.log('Ping request received:', {
    ip: req.ip,
    headers: req.headers,
    origin: req.get('origin')
  });
  
  // تعيين الرؤوس
  setCorsHeaders(req, res);
  
  res.json({ 
    status: 'ok', 
    message: 'خادم الأتمتة يستجيب',
    time: new Date().toISOString(),
    requestHeaders: req.headers
  });
});

// إضافة نقطة نهاية للفحص الصحي الشامل
app.get('/api/health', (req, res) => {
  // تسجيل معلومات الطلب للتشخيص
  console.log('Health check request received:', {
    ip: req.ip,
    headers: req.headers,
    origin: req.get('origin')
  });
  
  // تعيين الرؤوس
  setCorsHeaders(req, res);
  
  res.json({ 
    status: 'ok', 
    message: 'خادم الأتمتة في حالة جيدة',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    hostname: require('os').hostname(),
    network: {
      interfaces: Object.keys(require('os').networkInterfaces())
    }
  });
});

// عرض كل المتغيرات البيئية (باستثناء السرية) للتشخيص
const printableEnvVars = {};
for (const key in process.env) {
  if (!key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('TOKEN')) {
    printableEnvVars[key] = process.env[key];
  }
}

// التحقق من وجود مجلد dist
let staticDir = path.join(__dirname, '../../dist');
let publicDir = path.join(__dirname, '../../public');
console.log(`التحقق من وجود dist في: ${staticDir}`);
console.log(`التحقق من وجود public في: ${publicDir}`);

if (!fs.existsSync(staticDir)) {
  console.log('مجلد dist غير موجود، استخدام مجلد public بدلاً منه');
  staticDir = publicDir;
} else {
  console.log('تم العثور على مجلد dist، ستتم خدمة الملفات الثابتة منه');
}

// إضافة خدمة الملفات الثابتة
app.use(express.static(staticDir));

// إضافة مسار لصفحة ترحيبية بسيطة
app.get('/', (req, res) => {
  // التحقق من وجود مجلد dist/index.html
  const indexPath = path.join(staticDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log(`تم العثور على index.html، إرسال الملف من ${indexPath}`);
    return res.sendFile(indexPath);
  }
  
  console.log('لم يتم العثور على index.html، إرسال صفحة HTML المضمنة');
  
  res.send(`
    <html dir="rtl">
      <head>
        <title>خادم الأتمتة</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .success { color: green; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
          .endpoint { margin: 20px 0; background: #f0f8ff; padding: 15px; border-radius: 5px; }
          .note { background: #ffffd9; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>خادم الأتمتة يعمل! <span class="success">✓</span></h1>
          <p>خادم الأتمتة يعمل بنجاح على المنفذ <strong>${PORT}</strong>.</p>
          
          <div class="endpoint">
            <h3>نقاط النهاية المتاحة:</h3>
            <ul>
              <li><strong>GET /api/status</strong> - التحقق من حالة الخادم</li>
              <li><strong>GET /api/ping</strong> - اختبار سريع للاستجابة</li>
              <li><strong>GET /api/health</strong> - معلومات صحة الخادم</li>
              <li><strong>POST /api/automate</strong> - تنفيذ السيناريو باستخدام Puppeteer</li>
            </ul>
          </div>
          
          <div class="note">
            <h3>ملاحظة:</h3>
            <p>يجب أن يكون عنوان واجهة المستخدم في التطبيق الرئيسي مكونًا ليشير إلى:</p>
            <pre>${AUTOMATION_SERVER_URL}/api</pre>
            <p>متغيرات البيئة الرئيسية:</p>
            <pre>PORT=${PORT}</pre>
            <pre>NODE_ENV=${NODE_ENV}</pre>
            <pre>AUTOMATION_SERVER_URL=${AUTOMATION_SERVER_URL}</pre>
            <pre>VITE_AUTOMATION_SERVER_URL=${process.env.VITE_AUTOMATION_SERVER_URL || 'not set'}</pre>
            <pre>RENDER_EXTERNAL_URL=${process.env.RENDER_EXTERNAL_URL || 'not set'}</pre>
          </div>
          
          <div class="note">
            <h3>موقع الملفات الثابتة:</h3>
            <pre>Static Dir: ${staticDir}</pre>
            <pre>Public Dir: ${publicDir}</pre>
            <pre>Index Exists: ${fs.existsSync(path.join(staticDir, 'index.html')) ? 'نعم' : 'لا'}</pre>
          </div>
        </div>
      </body>
    </html>
  `);
});

// مسار للتأكد من أن الخادم يعمل
app.get('/api/status', (req, res) => {
  // تسجيل معلومات الطلب للتشخيص
  console.log('Status request received:', {
    ip: req.ip,
    headers: req.headers,
    origin: req.get('origin')
  });
  
  // تعيين الرؤوس مع التحقق من صحة الأصل
  if (!setCorsHeaders(req, res)) {
    return res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
  }
  
  // إضافة معلومات النظام للمساعدة في التشخيص
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cwd: process.cwd(),
    env: NODE_ENV,
    port: PORT,
    automationServerUrl: AUTOMATION_SERVER_URL,
    viteAutomationServerUrl: process.env.VITE_AUTOMATION_SERVER_URL || 'not set',
    renderExternalUrl: process.env.RENDER_EXTERNAL_URL || 'not set',
    railwayPublicDomain: process.env.RAILWAY_PUBLIC_DOMAIN || 'not set',
    staticDir: staticDir,
    publicDir: publicDir,
    indexExists: fs.existsSync(path.join(staticDir, 'index.html')),
    allEnvVars: printableEnvVars,
    allowedDomains: ALLOWED_DOMAINS
  };
  
  res.json({ 
    status: 'ok', 
    message: 'خادم الأتمتة يعمل بنجاح', 
    time: new Date().toISOString(),
    systemInfo,
    host: req.headers.host,
    ip: req.ip,
    headers: req.headers,
    staticFiles: {
      dist: fs.existsSync(path.join(__dirname, '../../dist')),
      public: fs.existsSync(path.join(__dirname, '../../public')),
      indexHtml: fs.existsSync(path.join(staticDir, 'index.html'))
    }
  });
});

// إضافة نقطة نهاية بسيطة للتحقق السريع من الاتصال
app.get('/api/ping', (req, res) => {
  // تسجيل معلومات الطلب للتشخيص
  console.log('Ping request received:', {
    ip: req.ip,
    headers: req.headers,
    origin: req.get('origin')
  });
  
  // تعيين الرؤوس مع التحقق من صحة الأصل
  if (!setCorsHeaders(req, res)) {
    return res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
  }
  
  res.json({ 
    status: 'ok', 
    message: 'خادم الأتمتة يستجيب',
    time: new Date().toISOString(),
    requestHeaders: req.headers,
    allowedOrigins: ALLOWED_DOMAINS
  });
});

// تحسين دالة التحقق من تثبيت Puppeteer
const checkPuppeteer = async () => {
  try {
    console.log('جاري التحقق من تثبيت Puppeteer وتوفر متصفح Chrome...');
    
    // طباعة معلومات النظام للتشخيص
    console.log('معلومات النظام:');
    console.log(`- نظام التشغيل: ${process.platform}`);
    console.log(`- معمارية النظام: ${process.arch}`);
    console.log(`- إصدار Node.js: ${process.version}`);
    console.log(`- مجلد العمل الحالي: ${process.cwd()}`);
    
    // تحقق من وجود الملفات المطلوبة
    const browserFetcher = puppeteer.createBrowserFetcher();
    const localRevisions = await browserFetcher.localRevisions();
    console.log(`- إصدارات المتصفح المثبتة محلياً: ${localRevisions.join(', ') || 'لا يوجد'}`);
    
    // محاولة متعددة بضبط مختلف
    try {
      console.log('محاولة إطلاق المتصفح مع الإعدادات الأساسية...');
      const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 30000,
        ignoreHTTPSErrors: true,
        dumpio: true // طباعة stdout و stderr من المتصفح للمساعدة في التصحيح
      });
      await browser.close();
      console.log('تم تشغيل وإغلاق المتصفح بنجاح!');
      return true;
    } catch (basicError) {
      console.error('فشل في الإطلاق مع الإعدادات الأساسية:', basicError.message);
      
      // محاولة ثانية مع إعدادات مختلفة
      try {
        console.log('محاولة إطلاق المتصفح مع إعدادات متقدمة...');
        const browser = await puppeteer.launch({ 
          headless: 'new',
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
          ],
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || undefined,
          timeout: 60000,
          ignoreHTTPSErrors: true,
          dumpio: true
        });
        await browser.close();
        console.log('تم تشغيل وإغلاق المتصفح بنجاح (مع الإعدادات المتقدمة)!');
        return true;
      } catch (advancedError) {
        console.error('فشل في الإطلاق حتى مع الإعدادات المتقدمة:', advancedError.message);
        
        // تحقق من وجود ملف تنفيذي للمتصفح
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
        if (executablePath) {
          const fs = require('fs');
          const exists = fs.existsSync(executablePath);
          console.log(`- ملف تنفيذي للمتصفح (${executablePath}): ${exists ? 'موجود' : 'غير موجود'}`);
        } else {
          console.log('- لم يتم تعيين PUPPETEER_EXECUTABLE_PATH أو CHROME_BIN');
        }
        
        // طباعة متغيرات البيئة المتعلقة بـ Puppeteer
        Object.keys(process.env)
          .filter(key => key.includes('PUPPETEER') || key.includes('CHROME'))
          .forEach(key => {
            console.log(`- ${key}: ${process.env[key]}`);
          });
        
        // محاولة اكتشاف المشكلة بشكل أفضل
        throw new Error(`تعذر تهيئة Puppeteer: ${basicError.message}، وأيضاً: ${advancedError.message}`);
      }
    }
  } catch (error) {
    console.error('خطأ في تهيئة Puppeteer:', error);
    return false;
  }
};

/**
 * دالة مساعدة للعثور على أفضل خيار في القائمة المنسدلة
 * @param {Array} options قائمة الخيارات المتاحة
 * @param {string} targetValue القيمة المستهدفة
 * @returns {Object|null} أفضل خيار مطابق أو null
 */
const findBestSelectOption = async (page, selectElementHandle, targetValue) => {
  return await page.evaluate((element, target) => {
    if (!element || !target || target.trim() === '') return null;
    
    const options = Array.from(element.options || []);
    if (!options.length) return null;
    
    const normalizedTarget = target.trim().toLowerCase();
    
    // محاولة المطابقة المباشرة أولاً
    let bestMatch = options.find(option => {
      const optionText = option.text.trim().toLowerCase();
      const optionValue = option.value.trim().toLowerCase();
      return optionText === normalizedTarget || optionValue === normalizedTarget;
    });
    
    // إذا لم نجد مطابقة مباشرة، نبحث عن مطابقة جزئية
    if (!bestMatch) {
      bestMatch = options.find(option => {
        const optionText = option.text.trim().toLowerCase();
        const optionValue = option.value.trim().toLowerCase();
        return optionText.includes(normalizedTarget) || normalizedTarget.includes(optionText) ||
               optionValue.includes(normalizedTarget) || normalizedTarget.includes(optionValue);
      });
    }
    
    // إذا لم نجد أي مطابقة، قد نحاول استراتيجيات أخرى...
    
    if (bestMatch) {
      return {
        value: bestMatch.value,
        text: bestMatch.text,
        index: bestMatch.index
      };
    }
    
    return null;
  }, selectElementHandle, targetValue);
};

/**
 * دالة محسنة للعثور على العنصر باستخدام استراتيجيات متعددة
 */
const findElement = async (page, finder, context = null) => {
  // قائمة بكل المحددات والـ XPaths التي سنحاول بها
  const selectors = [];
  const xpaths = [];
  
  console.log(`محاولة العثور على العنصر باستخدام: ${finder}`);
  
  // تحديد الاستراتيجية المناسبة بناءً على نمط المحدد
  if (finder.startsWith('//') || finder.startsWith('/html')) {
    // XPath: إضافة المحدد الأصلي أولاً
    xpaths.push(finder);
  } else if (finder.startsWith('#')) {
    // معرف: إضافة المحدد الأصلي أولاً
    selectors.push(finder);
    
    // المحاولة أيضًا باستخدام XPath للمعرف
    const id = finder.substring(1);
    xpaths.push(`//*[@id="${id}"]`);
  } else if (finder.startsWith('Id::')) {
    // معرف بتنسيق مختلف
    const id = finder.replace('Id::', '');
    selectors.push(`#${id}`);
    xpaths.push(`//*[@id="${id}"]`);
  } else if (finder.startsWith('ClassName::')) {
    // اسم الصف
    const className = finder.replace('ClassName::', '');
    const classNames = className.split(' ');
    
    // محدد CSS للصف
    if (classNames.length === 1) {
      selectors.push(`.${className}`);
    } else {
      selectors.push(`.${classNames.join('.')}`);
    }
    
    // محاولة باستخدام XPath للصف
    xpaths.push(`//*[contains(@class, "${className}")]`);
  } else if (finder.startsWith('Name::')) {
    // استخدام سمة الاسم
    const name = finder.replace('Name::', '');
    selectors.push(`[name="${name}"]`);
    xpaths.push(`//*[@name="${name}"]`);
  } else if (finder.startsWith('TagName::')) {
    // استخدام اسم العلامة
    const tagName = finder.replace('TagName::', '');
    selectors.push(tagName);
    xpaths.push(`//${tagName}`);
  } else if (finder.startsWith('Selector::')) {
    // استخدام محدد CSS
    const selector = finder.replace('Selector::', '');
    selectors.push(selector);
  } else if (finder.startsWith('SelectorAll::')) {
    // استخدام محدد SelectorAll
    const selector = finder.replace('SelectorAll::', '');
    selectors.push(selector);
  } else {
    // محاولة استخدام المحدد كما هو
    selectors.push(finder);
    
    // محاولة استنتاج أنواع أخرى من المحددات بناءً على النمط
    if (finder.includes('[') && finder.includes(']')) {
      // ربما محدد سمة
      xpaths.push(`//*${finder}`);
    } else if (!finder.includes(' ') && !finder.includes('>') && !finder.includes('+')) {
      // ربما اسم علامة بسيط
      xpaths.push(`//${finder}`);
    }
  }
  
  // محاولات اكتشاف مرنة إضافية - إضافة محددات آلية عامة
  const generalFieldTypes = ['input', 'select', 'textarea', 'button'];
  for (const type of generalFieldTypes) {
    xpaths.push(`//${type}[contains(@name, "${finder}") or contains(@id, "${finder}") or contains(@placeholder, "${finder}")]`);
  }
  
  // إضافة محددات أكثر ذكاءً استنادًا إلى أنماط الحقول المعروفة
  if (finder.includes('phone') || finder.includes('mobile') || finder.includes('هاتف') || finder.includes('جوال')) {
    selectors.push('input[type="tel"]');
    selectors.push('input[name*="phone"]');
    selectors.push('input[id*="phone"]');
    selectors.push('input[placeholder*="هاتف"]');
    selectors.push('input[placeholder*="جوال"]');
    xpaths.push('//input[contains(@placeholder, "هاتف")]');
    xpaths.push('//input[contains(@placeholder, "جوال")]');
    xpaths.push('//label[contains(text(), "هاتف")]/following::input[1]');
    xpaths.push('//label[contains(text(), "جوال")]/following::input[1]');
  } else if (finder.includes('name') || finder.includes('اسم')) {
    selectors.push('input[name*="name"]');
    selectors.push('input[id*="name"]');
    selectors.push('input[placeholder*="اسم"]');
    xpaths.push('//input[contains(@placeholder, "اسم")]');
    xpaths.push('//label[contains(text(), "اسم")]/following::input[1]');
  } else if (finder.includes('city') || finder.includes('province') || finder.includes('مدينة') || finder.includes('محافظة')) {
    selectors.push('select[name*="city"]');
    selectors.push('select[id*="city"]');
    selectors.push('select[name*="province"]');
    selectors.push('select[id*="province"]');
    selectors.push('select[placeholder*="مدينة"]');
    selectors.push('select[placeholder*="محافظة"]');
    xpaths.push('//select[contains(@name, "city") or contains(@name, "province")]');
    xpaths.push('//label[contains(text(), "مدينة") or contains(text(), "محافظة")]/following::select[1]');
  } else if (finder.includes('price') || finder.includes('amount') || finder.includes('cost') || finder.includes('سعر') || finder.includes('مبلغ')) {
    selectors.push('input[type="number"]');
    selectors.push('input[name*="price"]');
    selectors.push('input[id*="price"]');
    selectors.push('input[name*="amount"]');
    selectors.push('input[id*="amount"]');
    selectors.push('input[placeholder*="سعر"]');
    selectors.push('input[placeholder*="مبلغ"]');
    xpaths.push('//input[contains(@placeholder, "سعر") or contains(@placeholder, "مبلغ")]');
    xpaths.push('//label[contains(text(), "سعر") or contains(text(), "مبلغ")]/following::input[1]');
  }
  
  // خاص بالعراق - محددات إضافية للحقول العراقية الشائعة
  if (finder.includes('code') || finder.includes('tracking') || finder.includes('رمز') || finder.includes('كود') || finder.includes('وصل')) {
    selectors.push('input[name*="wasl"]');
    selectors.push('input[id*="wasl"]');
    selectors.push('input[placeholder*="رقم الوصل"]');
    selectors.push('input[placeholder*="رقم البوليصة"]');
    xpaths.push('//input[contains(@placeholder, "رقم") and contains(@placeholder, "وصل")]');
    xpaths.push('//label[contains(text(), "رقم الوصل")]/following::input[1]');
  }
  
  // بدء محاولات العثور على العنصر
  let element = null;

  // محاولة باستخدام محددات CSS أولاً
  for (const selector of selectors) {
    try {
      console.log(`محاولة العثور على العنصر باستخدام المحدد CSS: ${selector}`);
      const selectorElement = context 
        ? await context.$(selector) 
        : await page.$(selector);
      
      if (selectorElement) {
        console.log(`تم العثور على العنصر باستخدام المحدد CSS: ${selector}`);
        element = selectorElement;
        break;
      }
    } catch (error) {
      console.warn(`فشل في استخدام المحدد CSS '${selector}':`, error.message);
    }
  }

  // إذا لم يتم العثور على العنصر، نحاول باستخدام XPath
  if (!element) {
    for (const xpath of xpaths) {
      try {
        console.log(`محاولة العثور على العنصر باستخدام XPath: ${xpath}`);
        const [xpathElement] = context 
          ? await context.$x(xpath) 
          : await page.$x(xpath);
        
        if (xpathElement) {
          console.log(`تم العثور على العنصر باستخدام XPath: ${xpath}`);
          element = xpathElement;
          break;
        }
      } catch (error) {
        console.warn(`فشل في استخدام XPath '${xpath}':`, error.message);
      }
    }
  }

  return element;
};

/**
 * دالة محسنة لملء حقل النموذج استنادًا إلى نوعه
 */
const fillFormField = async (page, element, value) => {
  if (!element) return false;
  
  // الحصول على نوع العنصر
  const tagName = await page.evaluate(el => el.tagName.toLowerCase(), element);
  const type = await page.evaluate(el => el.type && el.type.toLowerCase(), element);
  
  console.log(`ملء العنصر من النوع ${tagName}${type ? '/' + type : ''} بالقيمة: ${value}`);
  
  if (tagName === 'select') {
    // القائمة المنسدلة - استخدام استراتيجية متعددة
    try {
      // أولاً: محاولة اختيار الخيار مباشرة باستخدام الوظيفة المحسنة
      const bestOption = await findBestSelectOption(page, element, value);
      
      if (bestOption) {
        await page.evaluate((el, option) => {
          el.value = option.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, element, bestOption);
        
        console.log(`تم اختيار "${bestOption.text}" (القيمة: ${bestOption.value}) من القائمة المنسدلة`);
        return true;
      }
      
      // ثانيًا: محاولة البحث عن النص المطابق في الخيارات المتاحة
      const optionsSelected = await page.evaluate((el, val) => {
        // البحث عن مطابقة نصية
        for (let i = 0; i < el.options.length; i++) {
          const optionText = el.options[i].text.trim().toLowerCase();
          const optionValue = el.options[i].value.trim().toLowerCase();
          const targetValue = val.trim().toLowerCase();
          
          // تجربة مطابقة دقيقة أولاً
          if (optionText === targetValue || optionValue === targetValue) {
            el.selectedIndex = i;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, text: el.options[i].text, value: el.options[i].value };
          }
          
          // ثم تجربة مطابقة جزئية
          if (optionText.includes(targetValue) || targetValue.includes(optionText)) {
            el.selectedIndex = i;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, text: el.options[i].text, value: el.options[i].value };
          }
        }
        
        return { success: false };
      }, element, value);
      
      if (optionsSelected.success) {
        console.log(`تم اختيار "${optionsSelected.text}" (القيمة: ${optionsSelected.value}) من القائمة المنسدلة`);
        return true;
      }
      
      // ثالثًا: إذا لم تنجح المحاولات السابقة، انقر على القائمة وابحث عن الخيار في واجهة المستخدم
      await element.click();
      await page.waitForTimeout(500); // انتظار ظهور القائمة
      
      // محاولة النقر على خيار يحتوي على النص المطلوب
      const optionXPath = `//option[contains(text(), "${value}")]|//li[contains(text(), "${value}")]`;
      try {
        const [option] = await page.$x(optionXPath);
        if (option) {
          await option.click();
          console.log(`تم النقر على الخيار "${value}" من القائمة المنسدلة`);
          return true;
        }
      } catch (error) {
        console.warn('فشل في النقر على الخيار من القائمة المنسدلة:',
          error.message);
        return false;
      }
    } catch (error) {
      console.warn('فشل في ملء القائمة المنسدلة:', error.message);
      return false;
    }
  } else if (tagName === 'input' && (type === 'checkbox' || type === 'radio')) {
    // مربع اختيار أو زر راديو - تحديد بناءً على قيمة (true/false أو قيمة محددة)
    try {
      if (value === true || value === 'true' || value === '1' || value === 'yes' || value === 'checked' || value === 'on') {
        // تحقق مما إذا كان مربع الاختيار محددًا بالفعل
        const isChecked = await page.evaluate(el => el.checked, element);
        if (!isChecked) {
          await element.click();
          console.log(`تم تحديد مربع الاختيار/زر الراديو`);
        } else {
          console.log(`مربع الاختيار/زر الراديو محدد بالفعل`);
        }
      } else if (type === 'radio' && value) {
        // للأزرار الراديو، يمكننا أيضًا اختيار استنادًا إلى قيمتها
        const radioValue = await page.evaluate(el => el.value, element);
        if (radioValue === value || radioValue.includes(value) || value.includes(radioValue)) {
          await element.click();
          console.log(`تم تحديد زر الراديو بالقيمة '${radioValue}'`);
        }
      } else if (value === false || value === 'false' || value === '0' || value === 'no' || value === 'unchecked' || value === 'off') {
        // إذا كان مربع الاختيار محددًا ونريد إلغاء تحديده
        const isChecked = await page.evaluate(el => el.checked, element);
        if (isChecked && type === 'checkbox') { // يمكننا فقط إلغاء تحديد مربعات الاختيار وليس أزرار الراديو
          await element.click();
          console.log(`تم إلغاء تحديد مربع الاختيار`);
        } else {
          console.log(`مربع الاختيار غير محدد بالفعل`);
        }
      }
      return true;
    } catch (error) {
      console.warn('فشل في تحديد/إلغاء تحديد مربع الاختيار/زر الراديو:', error.message);
      return false;
    }
  } else if (tagName === 'textarea' || (tagName === 'input' && type !== 'file')) {
    // حقول النص والإدخال (باستثناء حقول الملفات) - مسح وملء
    try {
      // مسح القيمة الحالية أولاً (3 محاولات مختلفة)
      try {
        await element.click({ clickCount: 3 }); // تحديد كل النص
        await page.keyboard.press('Backspace'); // حذف النص المحدد
      } catch (e) {
        try {
          await page.evaluate(el => { el.value = ''; }, element); // مسح مباشر للقيمة
        } catch (e2) {
          console.warn('فشل في مسح الحقل، محاولة كتابة القيمة مباشرة');
        }
      }
      
      // ثم كتابة القيمة الجديدة
      await element.type(String(value));
      console.log(`تم ملء الحقل بالقيمة: ${value}`);
      
      // إطلاق حدث التغيير يدويًا لضمان تنشيط المستمعين
      await page.evaluate(el => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, element);
      
      return true;
    } catch (error) {
      console.warn('فشل في ملء حقل النص:', error.message);
      
      // محاولة بديلة لملء الحقل
      try {
        await page.evaluate((el, val) => { el.value = val; }, element, String(value));
        // إطلاق حدث التغيير يدويًا
        await page.evaluate(el => {
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, element);
        
        console.log(`تم ملء الحقل باستخدام طريقة بديلة: ${value}`);
        return true;
      } catch (backupError) {
        console.error('فشلت جميع محاولات ملء الحقل:', backupError.message);
        return false;
      }
    }
  } else if (tagName === 'input' && type === 'file') {
    // حقل ملف - لا يمكن معالجته عن بعد بسبب قيود الأمان
    console.warn('لا يمكن ملء حقل ملف تلقائيًا بسبب قيود الأمان');
    return false;
  } else {
    // أنواع أخرى من العناصر - محاولة ضبط المحتوى النصي
    try {
      await page.evaluate((el, val) => { 
        if (typeof el.value !== 'undefined') {
          el.value = val;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.isContentEditable) {
          el.textContent = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, element, String(value));
      
      console.log(`تم ضبط قيمة العنصر إلى: ${value}`);
      return true;
    } catch (error) {
      console.warn('فشل في ضبط قيمة العنصر:', error.message);
      return false;
    }
  }
};

// إضافة نقطة نهاية لاختبار تثبيت Puppeteer
app.get('/api/check-puppeteer', async (req, res) => {
  if (!setCorsHeaders(req, res)) {
    return res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
  }
  
  try {
    console.log('اختبار تثبيت Puppeteer...');
    const success = await checkPuppeteer();
    
    if (success) {
      res.json({
        status: 'ok',
        message: 'تم تثبيت Puppeteer بنجاح ويمكنه إطلاق المتصفح',
        success: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'فشل في تهيئة Puppeteer أو إطلاق المتصفح',
        success: false,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('خطأ أثناء اختبار Puppeteer:', error);
    res.status(500).json({
      status: 'error',
      message: `فشل اختبار Puppeteer: ${error.message}`,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// معالج الطلبات لتنفيذ السيناريو باستخدام Puppeteer
app.post('/api/automate', async (req, res) => {
  console.log('تم استلام طلب أتمتة جديد');
  
  // تعيين رؤوس CORS
  if (!setCorsHeaders(req, res)) {
    return res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
  }
  
  console.log('نوع المحتوى:', req.get('Content-Type'));
  console.log('منشأ الطلب:', req.get('Origin'));
  
  // التحقق من البيانات الواردة
  const { projectUrl, actions, useBrowserData } = req.body;
  
  console.log(`معالجة طلب أتمتة لـ URL: ${projectUrl}`);
  console.log(`عدد الإجراءات: ${Array.isArray(actions) ? actions.length : 'غير صالح'}`);
  
  // تسجيل عينة من الإجراءات للتشخيص
  if (Array.isArray(actions) && actions.length > 0) {
    console.log('عينة من الإجراءات:');
    const sample = actions.slice(0, 3);
    sample.forEach((action, index) => {
      console.log(`إجراء ${index + 1}:`, {
        type: action.type,
        selector: action.selector,
        value: action.value
      });
    });
    
    if (actions.length > 3) {
      console.log(`... و ${actions.length - 3} إجراءات أخرى`);
    }
  }
  
  // التحقق من وجود URL المشروع والإجراءات
  if (!projectUrl) {
    console.error('خطأ: URL المشروع مفقود');
    return res.status(400).json({
      success: false,
      message: 'URL المشروع مطلوب'
    });
  }
  
  if (!Array.isArray(actions) || actions.length === 0) {
    console.error('خطأ: الإجراءات غير صالحة أو مفقودة');
    return res.status(400).json({
      success: false,
      message: 'يجب توفير قائمة صالحة من الإجراءات'
    });
  }
  
  // بدء تشغيل متصفح Puppeteer
  let browser = null;
  let page = null;
  let screenshots = [];
  
  try {
    console.log('جاري بدء متصفح Puppeteer...');
    
    // إعدادات Puppeteer (مع مزيد من الخيارات للتوافق)
    const browserOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1366,768',
        '--no-zygote',
        '--single-process',
        '--disable-features=site-per-process'
      ],
      ignoreHTTPSErrors: true,
      timeout: 60000,
      protocolTimeout: 60000,
      dumpio: true
    };
    
    // اختيار مسار تنفيذي مخصص إذا كان متاحًا
    if (process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN) {
      browserOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
      console.log(`استخدام متصفح Chrome/Chromium في المسار: ${browserOptions.executablePath}`);
    }
    
    // بدء المتصفح مع تسجيل أفضل للأخطاء
    try {
      browser = await puppeteer.launch(browserOptions);
      console.log('تم بدء متصفح Puppeteer بنجاح');
    } catch (browserError) {
      console.error('فشل في بدء متصفح Puppeteer:', browserError);
      
      // محاولة باستخدام إعدادات أبسط
      console.log('جاري محاولة بدء المتصفح بإعدادات مبسطة...');
      
      try {
        const simpleBrowserOptions = {
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          ignoreHTTPSErrors: true
        };
        
        browser = await puppeteer.launch(simpleBrowserOptions);
        console.log('نجح بدء المتصفح باستخدام الإعدادات المبسطة');
      } catch (simpleBrowserError) {
        console.error('فشلت أيضًا محاولة بدء المتصفح بالإعدادات المبسطة:', simpleBrowserError);
        
        // إرجاع استجابة خطأ مفصلة
        return res.status(500).json({
          success: false,
          message: 'فشل في بدء متصفح Puppeteer',
          error: {
            original: browserError.message,
            simplified: simpleBrowserError.message,
            stack: simpleBrowserError.stack
          },
          systemInfo: {
            platform: process.platform,
            nodeVersion: process.version,
            puppeteerVersion: require('puppeteer/package.json').version,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || 'المسار الافتراضي'
          }
        });
      }
    }
    
    // إنشاء صفحة جديدة وضبط العرض
    page = await browser.newPage();
    
    // ضبط حجم العرض
    await page.setViewport({ width: 1366, height: 768 });
    
    // تسجيل الأخطاء من وحدة تحكم الصفحة
    page.on('console', message => {
      console.log(`وحدة تحكم المتصفح [${message.type()}]: ${message.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error('خطأ في الصفحة:', error.message);
    });
    
    // ضبط User-Agent مخصص للمساعدة في تجنب الكشف عن الروبوتات
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // التنقل إلى URL المشروع
    console.log(`جاري الانتقال إلى URL: ${projectUrl}`);
    await page.goto(projectUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    console.log('تم تحميل الصفحة بنجاح، جاري تنفيذ الإجراءات...');
    
    // تجاوز تأثيرات التمرير لتحسين سرعة التنفيذ
    await page.evaluate(() => {
      // إيقاف تأثيرات التمرير السلسة
      try {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
          value: function(arg) {
            const rect = this.getBoundingClientRect();
            window.scrollTo(window.pageXOffset, rect.top + window.pageYOffset);
          },
          configurable: true
        });
      } catch (e) {
        console.warn('تعذر تعديل تأثير التمرير');
      }
    });
    
    // التقاط لقطة شاشة أولية للصفحة
    const initialScreenshot = await page.screenshot({ 
      encoding: 'base64',
      type: 'jpeg',
      quality: 70
    });
    
    screenshots.push({
      step: 'initial',
      timestamp: new Date().toISOString(),
      data: initialScreenshot
    });
    
    // تنفيذ كل إجراء في تسلسل
    const results = [];
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const startTime = Date.now();
      
      console.log(`تنفيذ الإجراء ${i + 1}/${actions.length}:`, action);
      
      const actionResult = {
        index: i,
        action: action.type,
        selector: action.selector || '',
        value: action.value || '',
        success: false,
        error: null,
        timestamp: new Date().toISOString(),
        duration: 0,
        screenshots: []
      };
      
      try {
        let element = null;
        
        // التعامل مع أنواع مختلفة من الإجراءات
        switch (action.type) {
          case 'click':
            // العثور على العنصر باستخدام استراتيجيات متعددة
            element = await findElement(page, action.selector);
            
            if (!element) {
              throw new Error(`لم يتم العثور على العنصر باستخدام المحدد: ${action.selector}`);
            }
            
            // التمرير إلى العنصر
            await page.evaluate(el => {
              el.scrollIntoView({ behavior: 'auto', block: 'center' });
            }, element);
            
            // انتظار قصير للتمرير
            await page.waitForTimeout(300);
            
            // التقاط لقطة شاشة قبل النقر
            const beforeClickScreenshot = await page.screenshot({ 
              encoding: 'base64',
              type: 'jpeg',
              quality: 60
            });
            
            actionResult.screenshots.push({
              step: 'before-click',
              timestamp: new Date().toISOString(),
              data: beforeClickScreenshot
            });
            
            // النقر على العنصر
            await element.click({ delay: 50 });
            
            // انتظار استقرار الصفحة
            await page.waitForTimeout(500);
            
            // التقاط لقطة شاشة بعد النقر
            const afterClickScreenshot = await page.screenshot({ 
              encoding: 'base64',
              type: 'jpeg',
              quality: 60
            });
            
            actionResult.screenshots.push({
              step: 'after-click',
              timestamp: new Date().toISOString(),
              data: afterClickScreenshot
            });
            
            actionResult.success = true;
            break;
          
          case 'fill':
            // العثور على العنصر باستخدام وظيفة البحث المحسنة
            element = await findElement(page, action.selector);
            
            if (!element) {
              throw new Error(`لم يتم العثور على العنصر للملء باستخدام المحدد: ${action.selector}`);
            }
            
            // التمرير إلى العنصر
            await page.evaluate(el => {
              el.scrollIntoView({ behavior: 'auto', block: 'center' });
            }, element);
            
            // انتظار قصير للتمرير
            await page.waitForTimeout(300);
            
            // التقاط لقطة شاشة قبل الملء
            const beforeFillScreenshot = await page.screenshot({
              encoding: 'base64',
              type: 'jpeg',
              quality: 60
            });
            
            actionResult.screenshots.push({
              step: 'before-fill',
              timestamp: new Date().toISOString(),
              data: beforeFillScreenshot
            });
            
            // ملء العنصر باستخدام وظيفة الملء المحسنة
            const fillResult = await fillFormField(page, element, action.value);
            
            if (!fillResult) {
              throw new Error(`فشل في ملء العنصر بالقيمة: ${action.value}`);
            }
            
            // انتظار استقرار الصفحة
            await page.waitForTimeout(500);
            
            // التقاط لقطة شاشة بعد الملء
            const afterFillScreenshot = await page.screenshot({
              encoding: 'base64',
              type: 'jpeg',
              quality: 60
            });
            
            actionResult.screenshots.push({
              step: 'after-fill',
              timestamp: new Date().toISOString(),
              data: afterFillScreenshot
            });
            
            actionResult.success = true;
            break;
          
          case 'select':
            // العثور على العنصر باستخدام وظيفة البحث المحسنة
            element = await findElement(page, action.selector);
            
            if (!element) {
              throw new Error(`لم يتم العثور على عنصر القائمة المنسدلة باستخدام المحدد: ${action.selector}`);
            }
            
            // التحقق مما إذا كان العنصر قائمة منسدلة
            const tagName = await page.evaluate(el => el.tagName.toLowerCase(), element);
            
            if (tagName !== 'select') {
              // محاولة العثور على قائمة منسدلة قريبة
              console.log('العنصر ليس قائمة منسدلة، محاولة العثور على قائمة منسدلة قريبة...');
              
              // البحث عن أقرب قائمة منسدلة (أحد العناصر الأصلية أو التالية)
              const nearbySelect = await page.evaluateHandle((el) => {
                // البحث في العناصر الأصلية
                if (el.querySelector('select')) {
                  return el.querySelector('select');
                }
                
                // البحث في العناصر التالية
                const next = el.nextElementSibling;
                if (next && next.tagName.toLowerCase() === 'select') {
                  return next;
                }
                
                // البحث في العناصر الأبناء التالية
                const parent = el.parentElement;
                if (parent && parent.querySelector('select')) {
                  return parent.querySelector('select');
                }
                
                return null;
              }, element);
              
              // إذا وجدنا قائمة منسدلة، استخدمها
              if (nearbySelect) {
                console.log('تم العثور على قائمة منسدلة قريبة');
                element = nearbySelect;
              } else {
                throw new Error('فشل في العثور على عنصر قائمة منسدلة صالح');
              }
            }
            
            // التمرير إلى العنصر
            await page.evaluate(el => {
              el.scrollIntoView({ behavior: 'auto', block: 'center' });
            }, element);
            
            // انتظار قصير
            await page.waitForTimeout(300);
            
            // التقاط لقطة شاشة قبل الاختيار
            const beforeSelectScreenshot = await page.screenshot({
              encoding: 'base64',
              type: 'jpeg',
              quality: 60
            });
            
            actionResult.screenshots.push({
              step: 'before-select',
              timestamp: new Date().toISOString(),
              data: beforeSelectScreenshot
            });
            
            // محاولة تحديد الخيار
            const selectResult = await fillFormField(page, element, action.value);
            
            if (!selectResult) {
              throw new Error(`فشل في اختيار القيمة "${action.value}" من القائمة المنسدلة`);
            }
            
            // انتظار استقرار الصفحة
            await page.waitForTimeout(500);
            
            // التقاط لقطة شاشة بعد الاختيار
            const afterSelectScreenshot = await page.screenshot({
              encoding: 'base64',
              type: 'jpeg',
              quality: 60
            });
            
            actionResult.screenshots.push({
              step: 'after-select',
              timestamp: new Date().toISOString(),
              data: afterSelectScreenshot
            });
            
            actionResult.success = true;
            break;
          
          case 'wait':
            const waitTime = parseInt(action.value) || 1000;
            console.log(`انتظار ${waitTime} مللي ثانية...`);
            await page.waitForTimeout(waitTime);
            actionResult.success = true;
            break;
          
          case 'navigate':
            console.log(`الانتقال إلى URL: ${action.value}`);
            await page.goto(action.value, { waitUntil: 'networkidle2', timeout: 30000 });
            actionResult.success = true;
            break;
          
          default:
            throw new Error(`نوع الإجراء غير مدعوم: ${action.type}`);
        }
      } catch (error) {
        console.error(`فشل الإجراء ${i + 1}:`, error);
        actionResult.success = false;
        actionResult.error = error.message;
        
        // التقاط لقطة شاشة للخطأ
        try {
          const errorScreenshot = await page.screenshot({ 
            encoding: 'base64',
            type: 'jpeg',
            quality: 70
          });
          
          actionResult.screenshots.push({
            step: 'error',
            timestamp: new Date().toISOString(),
            data: errorScreenshot
          });
        } catch (screenshotError) {
          console.error('فشل في التقاط لقطة شاشة للخطأ:', screenshotError);
        }
      }
      
      // حساب مدة الإجراء
      actionResult.duration = Date.now() - startTime;
      
      // إضافة نتيجة الإجراء إلى النتائج
      results.push(actionResult);
    }
    
    // التقاط لقطة شاشة نهائية
    const finalScreenshot = await page.screenshot({ 
      encoding: 'base64',
      type: 'jpeg',
      quality: 70
    });
    
    screenshots.push({
      step: 'final',
      timestamp: new Date().toISOString(),
      data: finalScreenshot
    });
    
    console.log('تم الانتهاء من تنفيذ جميع الإجراءات، إغلاق المتصفح...');
    
    // إغلاق المتصفح
    await browser.close();
    
    // حساب معدل النجاح
    const successfulActions = results.filter(r => r.success).length;
    const successRate = (successfulActions / actions.length) * 100;
    const isFullySuccessful = successfulActions === actions.length;
    
    console.log(`معدل النجاح: ${successRate.toFixed(1)}% (${successfulActions}/${actions.length})`);
    
    // إرجاع النتائج
    res.json({
      success: isFullySuccessful,
      message: isFullySuccessful 
        ? 'تم تنفيذ جميع الإجراءات بنجاح'
        : `تم تنفيذ ${successfulActions} من أصل ${actions.length} إجراءات بنجاح`,
      automationType: 'server',
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      results: results,
      screenshots: screenshots,
      metrics: {
        successRate: successRate,
        successfulActions: successfulActions,
        totalActions: actions.length,
        browserInfo: {
          platform: process.platform,
          nodeVersion: process.version
        }
      }
    });
  } catch (error) {
    console.error('خطأ أثناء تنفيذ الأتمتة:', error);
    
    // إغلاق المتصفح إذا كان لا يزال مفتوحًا
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('خطأ عند إغلاق المتصفح:', closeError);
      }
    }
    
    // إرجاع استجابة الخطأ
    res.status(500).json({
      success: false,
      message: `فشل في تنفيذ الأتمتة: ${error.message}`,
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
  }
});

// الاستماع على المنفذ المحدد
app.listen(PORT, () => {
  console.log(`خادم الأتمتة يعمل على المنفذ ${PORT}`);
  console.log(`NODE_ENV: ${NODE_ENV}`);
  console.log(`AUTOMATION_SERVER_URL: ${AUTOMATION_SERVER_URL}`);
  
  // التحقق من تثبيت Puppeteer عند بدء التشغيل
  checkPuppeteer()
    .then(success => {
      if (success) {
        console.log('تم تهيئة Puppeteer بنجاح ويمكنه إطلاق المتصفح');
      } else {
        console.error('فشل في تهيئة Puppeteer، قد تكون هناك مشكلة في تثبيت المتصفح');
      }
    })
    .catch(error => {
      console.error('خطأ أثناء التحقق من تثبيت Puppeteer:', error);
    });
});
