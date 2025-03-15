
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

// إضافة middleware
app.use(cors());
app.use(bodyParser.json());

// مسار للتأكد من أن الخادم يعمل
app.get('/api/status', (req, res) => {
  res.json({ status: 'running', message: 'خادم الأتمتة يعمل بنجاح' });
});

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

  let browser;
  try {
    // بدء متصفح جديد
    browser = await puppeteer.launch({
      headless: false, // جعله مرئيًا للتجربة، يمكن تغييره إلى true للتشغيل في وضع الخلفية
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1366, height: 768 }
    });

    const page = await browser.newPage();
    
    // تكوين المتصفح لتجاوز حماية مكافحة الروبوتات
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setJavaScriptEnabled(true); // تمكين JavaScript
    
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
    const screenshot = await page.screenshot({ type: 'png', encoding: 'base64' });
    
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
app.listen(port, () => {
  console.log(`خادم الأتمتة يعمل على المنفذ ${port}`);
});

