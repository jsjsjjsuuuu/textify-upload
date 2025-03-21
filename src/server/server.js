
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

// تحديد قائمة النطاقات المسموح بها
const ALLOWED_DOMAINS = [
  'lovable.app',
  'lovableproject.com',
  'd6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovableproject.com', // إضافة النطاق المحدد
  'localhost',
  '127.0.0.1'
];

// إضافة middleware
app.use(cors({
  origin: function(origin, callback) {
    // السماح بالطلبات بدون أصل (مثل تطبيقات الجوال أو curl أو Postman)
    if (!origin) return callback(null, true);
    
    // التحقق من النطاق
    const isAllowed = ALLOWED_DOMAINS.some(domain => origin.includes(domain));
    
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

// دالة مساعدة للتعامل مع رؤوس CORS
const setCorsHeaders = (req, res) => {
  const origin = req.get('origin');
  if (origin) {
    const isAllowed = ALLOWED_DOMAINS.some(domain => origin.includes(domain));
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Forwarded-For, X-Render-Client-IP, X-Client-ID, Cache-Control, Pragma, X-Request-Time, Origin, Referer');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// إضافة معالج خاص لطلبات OPTIONS لضمان استجابات CORS الصحيحة
app.options('*', (req, res) => {
  console.log('OPTIONS request received:', {
    path: req.path,
    headers: req.headers,
    origin: req.get('origin')
  });
  
  setCorsHeaders(req, res);
  res.status(200).end();
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
  
  // تعيين الرؤوس
  setCorsHeaders(req, res);
  
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
    allEnvVars: printableEnvVars
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

// مسار لتنفيذ السيناريو باستخدام Puppeteer
app.post('/api/automate', async (req, res) => {
  // تعيين الرؤوس
  setCorsHeaders(req, res);
  
  const { projectUrl, actions } = req.body;
  
  if (!projectUrl || !actions || !Array.isArray(actions)) {
    return res.status(400).json({ 
      success: false, 
      message: 'يرجى توفير عنوان URL للمشروع وقائمة الإجراءات' 
    });
  }

  console.log(`بدء أتمتة العملية على: ${projectUrl}`);
  console.log(`عدد الإجراءات: ${actions.length}`);

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

    // بدء متصفح جديد
    browser = await puppeteer.launch({
      headless: 'new', // استخدام وضع headless الجديد لتحسين الأداء والتوافق
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
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
    
    // الانتقال إلى الصفحة المطلوبة
    await page.goto(projectUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // تنفيذ كل إجراء واحد تلو الآخر
    const results = [];
    for (const action of actions) {
      try {
        const { name, finder, value, delay } = action;
        
        // انتظار إذا تم تحديد تأخير
        if (delay && !isNaN(parseInt(delay))) {
          await page.waitForTimeout(parseInt(delay) * 1000);
        }
        
        // تسجيل الإجراء الحالي
        console.log(`تنفيذ الإجراء: ${name || 'بلا اسم'} (${finder})`);
        
        // تحديد طريقة العثور على العنصر
        let element;
        if (finder.startsWith('//') || finder.startsWith('/html')) {
          // استخدام XPath
          await page.waitForXPath(finder, { timeout: 5000 });
          const elements = await page.$x(finder);
          if (elements.length > 0) element = elements[0];
        } else if (finder.startsWith('#')) {
          // استخدام معرف
          await page.waitForSelector(finder, { timeout: 5000 });
          element = await page.$(finder);
        } else if (finder.startsWith('Id::')) {
          // استخدام معرف بتنسيق مختلف
          const id = finder.replace('Id::', '');
          await page.waitForSelector(`#${id}`, { timeout: 5000 });
          element = await page.$(`#${id}`);
        } else if (finder.startsWith('ClassName::')) {
          // استخدام اسم الصف
          const className = finder.replace('ClassName::', '');
          const classSelector = '.' + className.split(' ').join('.');
          await page.waitForSelector(classSelector, { timeout: 5000 });
          element = await page.$(classSelector);
        } else if (finder.startsWith('Name::')) {
          // استخدام الاسم
          const name = finder.replace('Name::', '');
          await page.waitForSelector(`[name="${name}"]`, { timeout: 5000 });
          element = await page.$(`[name="${name}"]`);
        } else if (finder.startsWith('TagName::')) {
          // استخدام اسم العلامة
          const tagName = finder.replace('TagName::', '');
          await page.waitForSelector(tagName, { timeout: 5000 });
          element = await page.$(tagName);
        } else if (finder.startsWith('Selector::')) {
          // استخدام محدد CSS
          const selector = finder.replace('Selector::', '');
          await page.waitForSelector(selector, { timeout: 5000 });
          element = await page.$(selector);
        } else if (finder.startsWith('SelectorAll::')) {
          // استخدام محدد SelectorAll
          const selector = finder.replace('SelectorAll::', '');
          await page.waitForSelector(selector, { timeout: 5000 });
          const elements = await page.$$(selector);
          if (elements.length > 0) element = elements[0];
        } else {
          // محاولة استخدام المحدد كما هو
          await page.waitForSelector(finder, { timeout: 5000 });
          element = await page.$(finder);
        }
        
        if (!element) {
          results.push({
            name: name || 'بلا اسم',
            success: false,
            message: `لم يتم العثور على العنصر: ${finder}`
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
        }, element);
        
        // الحصول على نوع العنصر
        const tagName = await page.evaluate(el => el.tagName.toLowerCase(), element);
        
        // التعامل مع العنصر حسب نوعه
        if (tagName === 'select') {
          // القائمة المنسدلة
          await page.evaluate((el, val) => {
            // البحث عن الخيار بالنص أو القيمة
            for (let i = 0; i < el.options.length; i++) {
              if (el.options[i].text === val || el.options[i].value === val) {
                el.selectedIndex = i;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
            return false;
          }, element, value);
        } else if (tagName === 'input' || tagName === 'textarea') {
          // حقول الإدخال
          await element.click({ clickCount: 3 }); // تحديد النص الحالي
          await element.type(value, { delay: 100 }); // كتابة ببطء لتقليد سلوك المستخدم
        } else {
          // أزرار أو عناصر أخرى
          await element.click();
        }
        
        // إضافة تأخير صغير بعد كل إجراء لمحاكاة تفاعل المستخدم
        await page.waitForTimeout(500);
        
        results.push({
          name: name || 'بلا اسم',
          success: true,
          message: `تم تنفيذ الإجراء بنجاح`
        });
      } catch (error) {
        console.error(`خطأ في تنفيذ الإجراء:`, error);
        results.push({
          name: action.name || 'بلا اسم',
          success: false,
          message: `خطأ: ${error.message}`
        });
      }
    }
    
    // تأخير قبل الإغلاق للتمكن من رؤية النتائج
    await page.waitForTimeout(2000);
    
    // التقاط لقطة شاشة
    const screenshotPath = path.join(screenshotDir, `automation_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, type: 'png' });
    const screenshot = fs.readFileSync(screenshotPath).toString('base64');
    
    // إغلاق المتصفح
    await browser.close();
    
    res.json({
      success: true,
      message: 'تم تنفيذ العمليات بنجاح',
      results,
      screenshot: `data:image/png;base64,${screenshot}`
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
