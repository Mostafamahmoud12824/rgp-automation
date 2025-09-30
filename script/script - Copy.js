const { Builder, By, until } = require("selenium-webdriver");
const XLSX = require("xlsx");
const readline = require("readline");

// دالة محسّنة لقراءة إدخال المستخدم مع دعم اللصق
function askQuestion(query) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false // يسمح باللصق بدون مشاكل
    });

    // عرض السؤال
    process.stdout.write(query);

    rl.on('line', answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// دالة مساعدة للانتظار والكتابة
async function waitAndType(driver, locator, text, timeout = 10000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await element.clear();
  await element.sendKeys(text);
  return element;
}

// دالة مساعدة للانتظار والضغط
async function waitAndClick(driver, locator, timeout = 10000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.click();
  return element;
}

(async function main() {
  let driver;
  
  try {
    console.log(`\n╔═══════════════════════════════════╗`);
    console.log(`║   Product Entry For RGB           ║`);
    console.log(`║        By Ameer Alaa              ║`);
    console.log(`╚═══════════════════════════════════╝\n`);

    // اطلب الدومين من المستخدم
    const domain = await askQuestion("🔗 Enter the domain (without https://): ");
    
    if (!domain) {
      throw new Error("Domain cannot be empty!");
    }
    
    console.log(`\n✓ Domain set to: ${domain}\n`);
    await new Promise(resolve => setTimeout(resolve, 1500));


    // قراءة ملف الإكسيل
    console.log("📂 Reading Excel file...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    const workbook = XLSX.readFile("./Excel/products.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = XLSX.utils.sheet_to_json(sheet);
    
    if (products.length === 0) {
      throw new Error("No products found in Excel file!");
    }
    

    driver = await new Builder().forBrowser("MicrosoftEdge").build();
    await driver.manage().window().maximize();

    await driver.get(`https://${domain}/auth/employees/login`);

    await waitAndType(driver, By.xpath('//input[@placeholder="Enter user name"]'), "cashier");
    await waitAndType(driver, By.xpath('//input[@placeholder="Enter password"]'), "@cashier");
    await waitAndClick(driver, By.css('button[type="submit"]'));
    
    await driver.sleep(2000);

    await waitAndClick(driver, By.xpath("//p[contains(text(),'Products entry')]"));

    await waitAndType(driver, By.xpath('//input[@placeholder="email or phone number"]'), "supercashier");
    await waitAndType(driver, By.xpath('//input[@placeholder="password"]'), "@supercashier");
    await waitAndClick(driver, By.xpath('//button[contains(text(),"Login")]'));

    // فتح صفحة المنتجات
    await waitAndClick(driver, By.xpath('//span[text()="products"]'));

    // إضافة المنتجات
    
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      
      try {

        // فتح نافذة إضافة منتج جديد
        await waitAndClick(driver, By.xpath('//span[text()="add a new product"]'));

        // اختيار الفئة الفرعية
        const subCategorySelect = await driver.wait(
          until.elementLocated(By.css('select[id^="select-sub_category_id"]')),
          10000
        );
        await subCategorySelect.findElement(By.css(`option:nth-child(${p.sub + 1})`)).click();

        // إدخال الاسم بالعربي
        await waitAndType(driver, By.css('input[id^="input-name-"]'), p.name_ar);

        // إدخال الاسم بالإنجليزي
        await waitAndType(
          driver,
          By.xpath('//span[text()="✽ Name in english"]/ancestor::label/following::input[1]'),
          p.name_en
        );

        // إدخال السعر
        const sellingCostInput = await driver.findElement(
          By.xpath('//legend[text()="Selling cost"]/following::input[1]')
        );
        await sellingCostInput.sendKeys(p.price.toString());

        // حفظ المنتج
        await waitAndClick(driver, By.xpath('//button[@type="submit" and contains(text(),"create")]'));

        await driver.sleep(500);

      } catch (err) {
        console.error(`  ✗ Failed to add product: ${err.message}\n`);
        // الاستمرار مع المنتج التالي
      }
    }

    console.log("\n╔═══════════════════════════════════╗");
    console.log("║   All products added successfully ║");
    console.log("╚═══════════════════════════════════╝\n");

  } catch (err) {
    console.error("\n❌ Critical Error:", err.message);
    console.error("\nStack trace:", err.stack);
  } 
})();