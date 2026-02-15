//!---- Restaurant Product Entry - Professional Edition
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const XLSX = require("xlsx");
const readline = require("readline");
const path = require("path");
const fs = require("fs");

function askQuestion(query) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    process.stdout.write(query);
    rl.on("line", answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function waitAndType(driver, locator, text, timeout = 10000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.clear();
  await element.sendKeys(text);
  return element;
}

async function forceCloseModal(driver) {
  try {
    await driver.executeScript(`
      document.querySelectorAll('.modal, .modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
    `);
    await driver.sleep(200);
  } catch {}
}

async function waitAndClick(driver, locator, timeout = 10000) {
  await forceCloseModal(driver);
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'})", element);
  await driver.sleep(100);
  await driver.executeScript("arguments[0].click()", element);
  return element;
}

async function uploadImage(driver, imagePath) {
  try {
    const fileInput = await driver.findElement(By.css('input[type="file"]'));
    await fileInput.sendKeys(imagePath);
    await driver.sleep(700);
  } catch {}
}

(async function main() {
  let driver;
  const failedProducts = [];
  const startTime = Date.now();

  try {
    // Header
    console.log("\n╔═══════════════════════════════════════════╗");
    console.log("║  🍽️  Restaurant Products Entry System   ║");
    console.log("║                                           ║");
    console.log("║  👨‍💻 Developer: Mostafa Mahmoud Salah     ║");
    console.log("║  🚀 Version: 2.0 (Professional Edition)   ║");
    console.log("╚═══════════════════════════════════════════╝\n");

    const domain = await askQuestion("🔗 Domain (without https://): ");
    console.log("");

    // Load Excel
    process.stdout.write("📂 Loading products data...");
    const excelPath = path.join(__dirname, "..", "Excel", "products.xlsx");
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = XLSX.utils.sheet_to_json(sheet);
    console.log(` ✓ ${products.length} products loaded\n`);

    const imagesFolder = path.join(__dirname, "..", "images");
    const hasImages = fs.existsSync(imagesFolder);

    // Initialize driver
    process.stdout.write("🌐 Starting browser...");
    const service = new firefox.ServiceBuilder("H:\\RGB\\geckodriver.exe");
    driver = await new Builder()
      .forBrowser("firefox")
      .setFirefoxService(service)
      .build();
    await driver.manage().window().maximize();
    console.log(" ✓\n");

    // Login
    process.stdout.write("🔐 Logging in...");
    await driver.get(`https://${domain}/auth/employees/login`);

    await waitAndType(driver, By.xpath('//input[@placeholder="Enter user name"]'), "cashier");
    await waitAndType(driver, By.xpath('//input[@placeholder="Enter password"]'), "@cashier");
    await waitAndClick(driver, By.css('button[type="submit"]'));
    await driver.sleep(1500);

    await waitAndClick(driver, By.xpath("//p[contains(text(),'Products entry')]"));
    await waitAndType(driver, By.xpath('//input[@placeholder="email or phone number"]'), "cashier");
    await waitAndType(driver, By.xpath('//input[@placeholder="password"]'), "@cashier");
    await waitAndClick(driver, By.xpath('//button[contains(text(),"Login")]'));
    await waitAndClick(driver, By.xpath('//span[text()="products"]'));
    await driver.sleep(700);
    console.log(" ✓\n");

    // Products
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("            📦 UPLOADING PRODUCTS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const num = String(i + 1).padStart(2, '0');
      const productName = p.name_en.padEnd(25, ' ');

      process.stdout.write(`[${num}/${products.length}] ${productName}`);

      try {
        await forceCloseModal(driver);
        await driver.sleep(150);
        
        await waitAndClick(driver, By.xpath('//span[text()="add a new product"]'));
        await driver.sleep(500);

        // Sub Category
        const subCategorySelect = await driver.wait(
          until.elementLocated(By.css('select[id^="select-sub_category_id"]')),
          7000
        );
        await subCategorySelect.findElement(By.css(`option:nth-child(${p.sub + 1})`)).click();

        // Names
        await waitAndType(driver, By.css('input[id^="input-name-"]'), p.name_ar);
        await waitAndType(
          driver,
          By.xpath('//span[text()="✽ Name in english"]/ancestor::label/following::input[1]'),
          p.name_en
        );

        // Arabic Description
        if (p.description_ar && p.description_ar.trim() !== '') {
          const arabicDesc = await driver.findElement(
            By.xpath('//span[text()="Description in arabic"]/ancestor::label/following::textarea[1]')
          );
          await arabicDesc.clear();
          await arabicDesc.sendKeys(p.description_ar);
        }

        // English Description
        if (p.description_en && p.description_en.trim() !== '') {
          const englishDesc = await driver.findElement(
            By.xpath('//span[text()="Description in english"]/ancestor::label/following::textarea[1]')
          );
          await englishDesc.clear();
          await englishDesc.sendKeys(p.description_en);
        }

        // Price
        const sellingCostInput = await driver.findElement(
          By.xpath('//legend[text()="Selling cost"]/following::input[1]')
        );
        await sellingCostInput.clear();
        await sellingCostInput.sendKeys(String(p.price));

        // Image
        if (hasImages && p.image_name) {
          const imagePath = path.join(imagesFolder, p.image_name);
          if (fs.existsSync(imagePath)) {
            await uploadImage(driver, imagePath);
          }
        }

        // Create
        await waitAndClick(
          driver,
          By.xpath('//button[@type="button" and contains(text(),"create")]')
        );
        await driver.sleep(700);

        console.log(" ✅");

      } catch (err) {
        console.log(" ❌");
        failedProducts.push({ name: p.name_en, error: err.message.split('\n')[0] });
        await forceCloseModal(driver);
        await driver.sleep(200);
      }
    }

    // Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const successCount = products.length - failedProducts.length;

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("              📊 FINAL REPORT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`⏱️  Total Time: ${duration}s`);
    console.log(`📦 Total Products: ${products.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failedProducts.length}\n`);

    if (failedProducts.length > 0) {
      console.log("⚠️  Failed Products:\n");
      failedProducts.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.name}`);
        console.log(`      → ${item.error}\n`);
      });
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (err) {
    console.error("\n❌ CRITICAL ERROR:", err.message);
  } finally {
    if (driver) {
      console.log("🔚 Closing browser...\n");
      await driver.sleep(2000);
      // await driver.quit();
    }
  }
})();
