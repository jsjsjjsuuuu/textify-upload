
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// تحويل __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// إضافة middleware
app.use(cors({
  origin: '*', // السماح لجميع الأصول بالوصول (يمكن تقييده لبيئة الإنتاج)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// إضافة مسار لصفحة ترحيبية بسيطة
app.get('/', (req, res) => {
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
          <p>خادم الأتمتة يعمل بنجاح على المنفذ <strong>${port}</strong>.</p>
          
          <div class="endpoint">
            <h3>نقاط النهاية المتاحة:</h3>
            <ul>
              <li><strong>GET /api/status</strong> - التحقق من حالة الخادم</li>
              <li><strong>POST /api/automate</strong> - تنفيذ السيناريو باستخدام Puppeteer</li>
            </ul>
          </div>
          
          <div class="note">
            <h3>ملاحظة:</h3>
            <p>يجب أن يكون عنوان واجهة المستخدم في التطبيق الرئيسي مكونًا ليشير إلى:</p>
            <pre>http://localhost:${port}/api</pre>
            <p>متغيرات البيئة:</p>
            <pre>PORT=${port}</pre>
            <pre>NODE_ENV=${process.env.NODE_ENV || 'development'}</pre>
            <pre>AUTOMATION_SERVER_URL=${process.env.AUTOMATION_SERVER_URL || 'not set'}</pre>
          </div>
        </div>
      </body>
    </html>
  `);
});

// مسار للتأكد من أن الخادم يعمل
app.get('/api/status', (req, res) => {
  // إضافة معلومات النظام للمساعدة في التشخيص
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cwd: process.cwd(),
    env: process.env.NODE_ENV || 'development',
    port: port,
    automationServerUrl: process.env.AUTOMATION_SERVER_URL || 'not set',
    viteAutomationServerUrl: process.env.VITE_AUTOMATION_SERVER_URL || 'not set'
  };
  
  res.json({ 
    status: 'ok', 
    message: 'خادم الأتمتة يعمل بنجاح', 
    time: new Date().toISOString(),
    systemInfo
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
      window.navigator.permissions.query = (parameters) => (
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

// بدء تشغيل الخادم
app.listen(port, '0.0.0.0', () => {
  console.log(`
╭───────────────────────────────────────╮
│                                       │
│   خادم الأتمتة يعمل على المنفذ ${port}    │
│                                       │
│   للتحقق قم بزيارة:                   │
│   http://localhost:${port}/api/status   │
│                                       │
│   متغيرات البيئة:                     │
│   NODE_ENV: ${process.env.NODE_ENV || 'development'}│
│   AUTOMATION_SERVER_URL: ${process.env.AUTOMATION_SERVER_URL || 'not set'}│
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
