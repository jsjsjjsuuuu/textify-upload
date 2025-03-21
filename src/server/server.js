
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

// التحقق من تثبيت Puppeteer
const checkPuppeteer = async () => {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 10000 
    });
    await browser.close();
    return true;
  } catch (error) {
    console.error('خطأ في تهيئة Puppeteer:', error.message);
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
        console.warn('فشل في النقر على الخيار من القائمة المنسدلة:', error.message);
      }
      
      // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
      console.warn(`لم يتم العثور على خيار مناسب للقيمة "${value}" في القائمة المنسدلة`);
      return false;
    } catch (error) {
      console.error('فشل في التعامل مع القائمة المنسدلة:', error.message);
      return false;
    }
  } else if (tagName === 'input' || tagName === 'textarea') {
    // حقول الإدخال - استراتيجية محسنة
    try {
      // مسح القيمة الحالية أولاً
      await page.evaluate(el => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, element);
      
      // محاولة تعيين القيمة
      if (type === 'checkbox' || type === 'radio') {
        // خانات الاختيار والأزرار الإشعاعية
        const shouldBeChecked = value === true || value === 'true' || value === '1' || value === 'on' || value === 'yes';
        await page.evaluate((el, check) => {
          if (el.checked !== check) {
            el.click();
          }
        }, element, shouldBeChecked);
      } else if (type === 'file') {
        // حقول الملفات
        // هنا يمكن إضافة معالجة تحميل الملفات إذا لزم الأمر
        console.log('حقول الملفات غير مدعومة حاليًا');
      } else {
        // مدخلات النصوص والأرقام
        // تنظيف القيمة وتنسيقها
        let formattedValue = value;
        if (type === 'tel' || type === 'phone') {
          // تنسيق أرقام الهواتف للعراق
          formattedValue = value.toString().replace(/\D/g, '');
          if (formattedValue.startsWith('964')) {
            formattedValue = `+${formattedValue}`;
          } else if (formattedValue.startsWith('0')) {
            formattedValue = `+964${formattedValue.substring(1)}`;
          }
        } else if (type === 'number' || type === 'currency') {
          // تنسيق الأرقام
          formattedValue = value.toString().replace(/[^\d.]/g, '');
        }
        
        // إدخال النص بطريقة طبيعية مع تأخير
        await element.type(formattedValue.toString(), { delay: 100 });
        
        // التأكد من تحديث القيمة وإطلاق الأحداث المناسبة
        await page.evaluate(el => {
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, element);
      }
      
      console.log(`تم ملء الحقل بالقيمة: ${value}`);
      return true;
    } catch (error) {
      console.error('فشل في ملء حقل الإدخال:', error.message);
      return false;
    }
  } else if (tagName === 'button' || (tagName === 'input' && (type === 'button' || type === 'submit'))) {
    // زر - قم بالنقر عليه
    try {
      await element.click();
      console.log('تم النقر على الزر');
      return true;
    } catch (error) {
      console.error('فشل في النقر على الزر:', error.message);
      return false;
    }
  } else {
    // أنواع أخرى من العناصر
    try {
      // محاولة النقر على العنصر كحل افتراضي
      await element.click();
      console.log(`تم النقر على عنصر من النوع ${tagName}`);
      return true;
    } catch (error) {
      console.error(`فشل في التفاعل مع عنصر من النوع ${tagName}:`, error.message);
      return false;
    }
  }
};

// مسار لتنفيذ السيناريو باستخدام Puppeteer
app.post('/api/automate', async (req, res) => {
  // تعيين الرؤوس مع التحقق من صحة الأصل
  if (!setCorsHeaders(req, res)) {
    return res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
  }
  
  const { projectUrl, actions, useBrowserData } = req.body;
  
  if (!projectUrl || !actions || !Array.isArray(actions)) {
    return res.status(400).json({ 
      success: false, 
      message: 'يرجى توفير عنوان URL للمشروع وقائمة الإجراءات' 
    });
  }

  console.log(`بدء أتمتة العملية على: ${projectUrl}`);
  console.log(`عدد الإجراءات: ${actions.length}`);
  console.log(`استخدام بيانات المتصفح: ${useBrowserData ? 'نعم' : 'لا'}`);

  // التحقق من تثبيت Puppeteer قبل المتابعة
  const puppeteerReady = await checkPuppeteer();
  if (!puppeteerReady) {
    return res.status(500).json({
      success: false,
      message: 'فشل في تهيئة Puppeteer. تأكد من تثبيت جميع الاعتماديات.'
    });
  }

  let browser;
  try {
    // إنشاء دليل للقطات الشاشة إذا لم يكن موجودًا
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // بدء متصفح جديد بإعدادات محسنة
    browser = await puppeteer.launch({
      headless: 'new', // استخدام وضع headless الجديد لتحسين الأداء والتوافق
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1366,768',
        '--disable-web-security', // للمساعدة في تجاوز قيود CORS
        '--allow-running-insecure-content' // للسماح بالمحتوى المختلط
      ],
      defaultViewport: { width: 1366, height: 768 }
    });

    const page = await browser.newPage();
    
    // تكوين المتصفح لتجاوز حماية مكافحة الروبوتات
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setJavaScriptEnabled(true); // تمكين JavaScript
    
    // إضافة تعديلات متقدمة لتجاوز كشف البوتات
    await page.evaluateOnNewDocument(() => {
      // إخفاء خصائص webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      
      // إضافة متصفح كامل window.chrome
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // أغراض كاذبة للمساعدة في تجاوز كشف الروبوتات
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (
        parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
    
    // تعيين رؤوس إضافية
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    // الانتقال إلى الصفحة المطلوبة مع زيادة المهلة
    console.log(`الانتقال إلى: ${projectUrl}`);
    await page.goto(projectUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log(`تم تحميل الصفحة: ${projectUrl}`);
    
    // انتظار قليلاً للتأكد من تحميل الصفحة بالكامل
    await page.waitForTimeout(2000);
    
    // إضافة معلومات تشخيصية عن الصفحة
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log(`عنوان الصفحة: ${pageTitle}`);
    console.log(`URL الفعلي: ${pageUrl}`);
    
    // الكشف عن الإطارات في الصفحة
    const framesInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(iframe => ({
        id: iframe.id || 'بدون معرف',
        name: iframe.name || 'بدون اسم',
        src: iframe.src || 'بدون مصدر'
      }));
    });
    
    if (framesInfo.length > 0) {
      console.log(`تم اكتشاف ${framesInfo.length} إطار في الصفحة:`, framesInfo);
    }
    
    // تنفيذ كل إجراء واحد تلو الآخر
    const results = [];
    for (const action of actions) {
      try {
        const { name, finder, value, delay } = action;
        
        // انتظار إذا تم تحديد تأخير
        if (delay && !isNaN(parseInt(delay))) {
          const delayMs = parseInt(delay) * 1000;
          console.log(`انتظار ${delayMs}ms قبل تنفيذ الإجراء التالي`);
          await page.waitForTimeout(delayMs);
        }
        
        // تسجيل الإجراء الحالي
        console.log(`تنفيذ الإجراء: ${name || 'بلا اسم'} (${finder})`);
        
        // بحث متعدد الاستراتيجيات عن العنصر
        let element = await findElement(page, finder);
        
        // إذا لم يتم العثور على العنصر، نحاول البحث في الإطارات
        if (!element && framesInfo.length > 0) {
          console.log(`لم يتم العثور على العنصر في الصفحة الرئيسية. محاولة البحث في الإطارات...`);
          
          const frames = page.frames();
          for (const frame of frames) {
            if (frame !== page.mainFrame()) {
              console.log(`البحث في الإطار: ${frame.name() || 'بدون اسم'}`);
              try {
                element = await findElement(frame, finder);
                if (element) {
                  console.log(`تم العثور على العنصر في الإطار!`);
                  break;
                }
              } catch (frameError) {
                console.warn(`خطأ أثناء البحث في الإطار:`, frameError.message);
              }
            }
          }
        }
        
        if (!element) {
          // إضافة استراتيجية إضافية: محاولة انتظار ظهور العنصر
          console.log(`لم يتم العثور على العنصر. محاولة الانتظار لمدة 5 ثوانٍ...`);
          
          try {
            await page.waitForFunction((finderStr) => {
              // تحويل المحدد إلى استعلام DOM مناسب
              let selector = finderStr;
              if (finderStr.startsWith('Id::')) selector = `#${finderStr.replace('Id::', '')}`;
              else if (finderStr.startsWith('ClassName::')) selector = `.${finderStr.replace('ClassName::', '').split(' ').join('.')}`;
              else if (finderStr.startsWith('Name::')) selector = `[name="${finderStr.replace('Name::', '')}"]`;
              else if (finderStr.startsWith('TagName::')) selector = finderStr.replace('TagName::', '');
              else if (finderStr.startsWith('Selector::')) selector = finderStr.replace('Selector::', '');
              
              // محاولة العثور على العنصر
              const el = document.querySelector(selector);
              return !!el;
            }, { timeout: 5000 }, finder);
            
            // محاولة أخرى للعثور على العنصر بعد الانتظار
            element = await findElement(page, finder);
          } catch (waitError) {
            console.warn(`انتهت مهلة الانتظار للعنصر:`, waitError.message);
          }
        }
        
        if (!element) {
          results.push({
            name: name || 'بلا اسم',
            success: false,
            message: `لم يتم العثور على العنصر: ${finder} بعد محاولات متعددة`
          });
          continue;
        }
        
        // توثيق العنصر قبل التفاعل
        await page.evaluate(el => {
          // إضافة تأثير بصري مؤقت
          const originalBackground = el.style.backgroundColor;
          const originalBorder = el.style.border;
          el.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
          el.style.border = '2px solid #ff5722';
          
          // إعادة الأسلوب الأصلي بعد فترة وجيزة
          setTimeout(() => {
            el.style.backgroundColor = originalBackground;
            el.style.border = originalBorder;
          }, 500);
          
          // تمرير العنصر إلى عرض المستخدم
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, element);
        
        // انتظار لحظة قبل التفاعل مع العنصر
        await page.waitForTimeout(500);
        
        // استخدام الدالة المحسنة لملء الحقل
        const success = await fillFormField(page, element, value);
        
        // تخزين نتيجة الإجراء
        results.push({
          name: name || 'بلا اسم',
          success: success,
          message: success ? `تم تنفيذ الإجراء بنجاح` : `فشل ملء الحقل بالقيمة: ${value}`
        });
        
        // إضافة تأخير صغير بعد كل إجراء لمحاكاة تفاعل المستخدم
        await page.waitForTimeout(500);
      } catch (error) {
        console.error(`خطأ في تنفيذ الإجراء:`, error);
        results.push({
          name: action.name || 'بلا اسم',
          success: false,
          message: `خطأ: ${error.message}`
        });
      }
    }
    
    // محاولة للنقر تلقائيًا على زر الحفظ
    try {
      console.log(`محاولة البحث عن زر الحفظ تلقائيًا...`);
      
      // قائمة محددات أزرار الحفظ المحتملة
      const saveButtonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button.save',
        'button.submit',
        'button:contains("حفظ")',
        'button:contains("إرسال")',
        'button:contains("تأكيد")',
        '[type="submit"]',
        '.btn-primary'
      ];
      
      const saveButtonXPaths = [
        '//button[contains(text(), "حفظ") or contains(text(), "خزن")]',
        '//button[contains(text(), "إرسال") or contains(text(), "ارسال")]',
        '//button[contains(text(), "تأكيد") or contains(text(), "أكد")]',
        '//input[@type="submit"]',
        '//button[@type="submit"]'
      ];
      
      let saveButton = null;
      
      // محاولة العثور على زر الحفظ باستخدام محددات CSS
      for (const selector of saveButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            console.log(`تم العثور على زر الحفظ باستخدام المحدد: ${selector}`);
            saveButton = button;
            break;
          }
        } catch (e) {
          // استمرار إلى المحاولة التالية
        }
      }
      
      // إذا لم يتم العثور على الزر، حاول باستخدام XPath
      if (!saveButton) {
        for (const xpath of saveButtonXPaths) {
          try {
            const [button] = await page.$x(xpath);
            if (button) {
              console.log(`تم العثور على زر الحفظ باستخدام XPath: ${xpath}`);
              saveButton = button;
              break;
            }
          } catch (e) {
            // استمرار إلى المحاولة التالية
          }
        }
      }
      
      // إذا تم العثور على زر الحفظ، انقر عليه
      if (saveButton) {
        console.log(`تم العثور على زر الحفظ، جاري النقر عليه...`);
        await saveButton.click();
        await page.waitForTimeout(2000); // انتظار لرؤية نتيجة النقر
        
        results.push({
          name: 'النقر التلقائي على زر الحفظ',
          success: true,
          message: 'تم النقر على زر الحفظ تلقائيًا'
        });
      } else {
        console.log(`لم يتم العثور على زر حفظ يمكن النقر عليه تلقائيًا`);
      }
    } catch (saveButtonError) {
      console.warn(`فشل في محاولة النقر التلقائي على زر الحفظ:`, saveButtonError.message);
    }
    
    // تأخير قبل الإغلاق للتمكن من رؤية النتائج
    await page.waitForTimeout(2000);
    
    // التقاط لقطة شاشة
    const screenshotPath = path.join(screenshotDir, `automation_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, type: 'png', fullPage: true });
    const screenshot = fs.readFileSync(screenshotPath).toString('base64');
    
    // إغلاق المتصفح
    await browser.close();
    
    res.json({
      success: true,
      message: 'تم تنفيذ العمليات بنجاح',
      results,
      screenshot: `data:image/png;base64,${screenshot}`,
      pageInfo: {
        title: pageTitle,
        url: pageUrl,
        frames: framesInfo.length
      }
    });
  } catch (error) {
    console.error('خطأ في تنفيذ الأتمتة:', error);
    
    // تأكد من إغلاق المتصفح في حالة حدوث خطأ
    if (browser) {
      await browser.close();
    }
    
    res.status(500).json({
      success: false,
      message: `حدث خطأ أثناء الأتمتة: ${error.message}`
    });
  }
});

// إضافة '*' كمسار لتوجيه أي طلب آخر إلى index.html (SPA)
app.get('*', (req, res) => {
  // التحقق مما إذا كان الطلب موجهًا إلى مسار API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      status: 'error',
      message: `مسار API غير موجود: ${req.path}` 
    });
  }

  // خدمة index.html للتطبيق وحيد الصفحة (SPA)
  const indexPath = path.join(staticDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log(`توجيه الطلب ${req.path} إلى index.html`);
    return res.sendFile(indexPath);
  }
  
  // إذا لم يتم العثور على index.html، أعرض رسالة خطأ
  res.status(404).send(`
    <html dir="rtl">
      <head><title>صفحة غير موجودة</title></head>
      <body>
        <h1>لم يتم العثور على الصفحة المطلوبة</h1>
        <p>لم يتم العثور على index.html في مجلد الملفات الثابتة.</p>
        <p>مسار: ${indexPath}</p>
        <p>معلومات إضافية:</p>
        <pre>${JSON.stringify({
          staticDir,
          publicDir,
          exists: {
            staticDir: fs.existsSync(staticDir),
            publicDir: fs.existsSync(publicDir)
          },
          files: fs.existsSync(staticDir) ? fs.readdirSync(staticDir) : []
        }, null, 2)}</pre>
      </body>
    </html>
  `);
});

// بدء تشغيل الخادم
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╭───────────────────────────────────────╮
│                                       │
│   خادم الأتمتة يعمل على المنفذ ${PORT}    │
│                                       │
│   للتحقق قم بزيارة:                   │
│   ${AUTOMATION_SERVER_URL}/api/status   │
│                                       │
│   متغيرات البيئة:                     │
│   NODE_ENV: ${NODE_ENV}                │
│   AUTOMATION_SERVER_URL: ${AUTOMATION_SERVER_URL}│
│                                       │
│   لإيقاف الخادم اضغط: Ctrl+C          │
│                                       │
╰───────────────────────────────────────╯
  `);
});

// التعامل مع الإغلاق الآمن
process.on('SIGINT', async () => {
  console.log('إيقاف خادم الأتمتة...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('خطأ غير معالج:', error);
});
