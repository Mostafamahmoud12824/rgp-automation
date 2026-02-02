# 🛒 Products Entry Automation

Automated product entry system built with **Node.js** and **Selenium WebDriver** to bulk-add products into a web system using data from an **Excel file**, with optional **image upload support**.

---

## 🚀 Overview

This project automates the repetitive task of entering products into a web-based system.  
It reads product data from an Excel sheet and simulates real user interactions through Firefox using Selenium.

The script is especially useful when dealing with **large product lists**, reducing manual effort and human error.

---

## ✨ Features

- 🔐 Automated login flow
- 📊 Read products data from Excel (`.xlsx`)
- 🏷️ Auto-fill product details:
  - Arabic name
  - English name
  - Sub-category
  - Selling price
- 🖼️ Upload product images automatically
- 🔁 Process hundreds of products sequentially
- ⚠️ Error handling without stopping execution
- 🧩 Clean, modular, and reusable helper functions

---

## 🧰 Tech Stack

- **Node.js**
- **Selenium WebDriver**
- **Firefox + GeckoDriver**
- **xlsx**
- Native Node modules (`fs`, `path`, `readline`)

---

project-root/
│
├── src/
│ └── main.js
│
├── Excel/
│ └── products.xlsx
│
├── images/
│ └── product-image.jpg
│
├── geckodriver.exe
└── README.md

---

## 📄 Excel File Format

The `products.xlsx` file must contain the following columns:

| Column Name | Description |
|------------|------------|
| name_ar    | Product name in Arabic |
| name_en    | Product name in English |
| price      | Selling price |
| sub        | Sub-category index |
| image_name | Image file name |

> 📌 Image files must exist inside the `images` folder.

---

## ▶️ Installation & Usage

### 1️⃣ Install dependencies
```bash
npm install selenium-webdriver xlsx
⚠️ Notes

Image upload is optional and skipped if the image is missing

Script can run in headless mode (configurable)

Browser auto-close is optional

Designed for controlled internal systems

👨‍💻 Author

Mostafa Mahmoud Salah
Software Engineer
Automation & Web Solutions

## 📂 Project Structure

