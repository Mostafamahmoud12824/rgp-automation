//! warehouses
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const XLSX = require("xlsx");
const readline = require("readline");
const path = require("path");
const fs = require("fs");

/* ===============================
   Helper: Read user input
================================ */
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

/* ===============================
   Helper: Wait then type
================================ */
async function waitAndType(driver, locator, text, timeout = 10000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.clear();
  await element.sendKeys(text);
  return element;
}

/* ===============================
   Helper: Wait then click
================================ */
async function waitAndClick(driver, locator, timeout = 10000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.click();
  return element;
}

/* ===============================
   Helper: Upload Image
================================ */
async function uploadImage(driver, imagePath, timeout = 10000) {
  try {
    // ابحث عن input من نوع file
    // جرب عدة selectors محتملة
    const possibleSelectors = [
      By.css('input[type="file"]'),
      By.xpath('//input[@type="file"]'),
      By.css('input[accept*="image"]'),
      By.xpath('//input[@accept and contains(@accept, "image")]')
    ];

    let fileInput = null;
    
    for (const selector of possibleSelectors) {
      try {
        fileInput = await driver.wait(until.elementLocated(selector), 3000);
        break;
      } catch (e) {
        continue;
      }
    }

    if (!fileInput) {
      console.warn("⚠️  Could not find file input element");
      return false;
    }

    // أرسل مسار الملف للـ input
    await fileInput.sendKeys(imagePath);
    
    // انتظر شوية بعد الرفع
    await driver.sleep(1000);
    
    console.log(`✓ Image uploaded: ${path.basename(imagePath)}`);
    return true;
    
  } catch (err) {
    console.warn(`⚠️  Failed to upload image: ${err.message}`);
    return false;
  }
}

/* ===============================
   Main
================================ */
(async function main() {
  let driver;

  try {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║   Products Entry Automation (FX)     ║`);
    console.log(`║   By Mostafa Mahmoud Salah           ║`);
    console.log(`║   + Image Upload Feature             ║`);
    console.log(`╚══════════════════════════════════════╝\n`);

    /* ---------- Domain ---------- */
    const domain = await askQuestion("🔗 Enter the domain (without https://): ");
    if (!domain) throw new Error("Domain cannot be empty!");

    /* ---------- Excel ---------- */
    console.log("📂 Reading Excel file...");
    const excelPath = path.join(__dirname, "..", "Excel", "products.xlsx");

    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found: ${excelPath}`);
    }

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = XLSX.utils.sheet_to_json(sheet);

    if (!products.length) {
      throw new Error("No products found in Excel file!");
    }

    console.log(`✓ ${products.length} products loaded\n`);

    /* ---------- Images Folder ---------- */
    const imagesFolder = path.join(__dirname, "..", "images");
    
    if (!fs.existsSync(imagesFolder)) {
      console.warn(`⚠️  Images folder not found: ${imagesFolder}`);
      console.warn(`⚠️  Will proceed without uploading images\n`);
    } else {
      console.log(`✓ Images folder found: ${imagesFolder}\n`);
    }

    /* ---------- Firefox Driver ---------- */
    const driverPath = "F:\\RGB\\geckodriver.exe";

    if (!fs.existsSync(driverPath)) {
      throw new Error(`GeckoDriver not found: ${driverPath}`);
    }

    const service = new firefox.ServiceBuilder(driverPath);
    const options = new firefox.Options();
    // options.addArguments("-headless"); // شيله لو مش عايز Headless

    driver = await new Builder()
      .forBrowser("firefox")
      .setFirefoxService(service)
      .setFirefoxOptions(options)
      .build();

    await driver.manage().window().maximize();

    /* ---------- Login ---------- */
    console.log("🔐 Logging in...");
    await driver.get(`https://${domain}/auth/employees/login`);

    await waitAndType(
      driver,
      By.xpath('//input[@placeholder="Enter user name"]'),
      "cashier"
    );

    await waitAndType(
      driver,
      By.xpath('//input[@placeholder="Enter password"]'),
      "@cashier"
    );

    await waitAndClick(driver, By.css('button[type="submit"]'));
    await driver.sleep(2000);

    await waitAndClick(driver, By.xpath("//p[contains(text(),'Products entry')]"));

    // await waitAndType(
    //   driver,
    //   By.xpath('//input[@placeholder="email or phone number"]'),
    //   "cashier"
    // );

    // await waitAndType(
    //   driver,
    //   By.xpath('//input[@placeholder="password"]'),
    //   "@cashier"
    // );

    // await waitAndClick(driver, By.xpath('//button[contains(text(),"Login")]'));
    // console.log("✓ Login successful\n");

    /* ---------- Products ---------- */
    await waitAndClick(driver, By.xpath('//span[text()="products"]'));

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      try {
        console.log(`\n➕ Adding product ${i + 1}/${products.length}: ${p.name_en}`);

        await waitAndClick(driver, By.xpath('//span[text()="add a new product"]'));

        // Sub Category
        const subCategorySelect = await driver.wait(
          until.elementLocated(By.css('select[id^="select-sub_category_id"]')),
          10000
        );
        await subCategorySelect
          .findElement(By.css(`option:nth-child(${p.sub + 1})`))
          .click();

        // Arabic Name
        await waitAndType(
          driver,
          By.css('input[id^="input-name-"]'),
          p.name_ar
        );

        // English Name
        await waitAndType(
          driver,
          By.xpath('//span[text()="✽ Name in english"]/ancestor::label/following::input[1]'),
          p.name_en
        );

        // Price
        const sellingCostInput = await driver.findElement(
          By.xpath('//legend[text()="Selling cost"]/following::input[1]')
        );
        await sellingCostInput.clear();
        await sellingCostInput.sendKeys(String(p.price));

        /* ---------- Upload Image ---------- */
        if (p.image_name && fs.existsSync(imagesFolder)) {
          const imagePath = path.join(imagesFolder, p.image_name);
          
          if (fs.existsSync(imagePath)) {
            console.log(`📷 Uploading image: ${p.image_name}`);
            await uploadImage(driver, imagePath);
          } else {
            console.warn(`⚠️  Image not found: ${p.image_name}`);
          }
        }

        // Create Button
        await waitAndClick(
          driver,
          By.xpath('//button[@type="button" and contains(text(),"create")]')
        );

        await driver.sleep(500);
        console.log(`✓ Product added successfully`);

      } catch (err) {
        console.error(`✗ Failed to add product: ${err.message}`);
      }
    }

    console.log(`\n✅ All products processed successfully\n`);

  } catch (err) {
    console.error("\n❌ Critical Error:", err.message);
    console.error(err.stack);
  } finally {
    if (driver) {
      console.log("\n🔚 Closing browser...");
      await driver.sleep(2000);
      // await driver.quit(); // uncomment لو عايز يقفل البراوزر أوتوماتيك
    }
  }
})();