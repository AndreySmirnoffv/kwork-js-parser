const { chromium } = require('playwright');
const ExcelJS = require('exceljs');

const baseUrl = 'https://korzinavdom.kz/catalog';
const maxPages = 357;
const concurrentRequests = 5;
const maxRetries = 3;

async function fetchPageData(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let data = [];

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to fetch ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        data = await page.evaluate(extractProductData);
        break;
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err.message);
        if (attempt === maxRetries) {
          throw err;
        }
      }
    }
  } finally {
    await browser.close();
  }

  return data;
}

function extractProductData() {
  const products = [];
  document.querySelectorAll('.card').forEach(card => {
    const name = card.querySelector('.card__description')?.innerText.trim();
    const price = card.querySelector('.card__cost-sale')?.innerText.trim();
    const discountElement = card.querySelector('.card__cost-sale.sale');
    const oldPriceElement = card.querySelector('.card__cost-old.ng-star-inserted');
    const hasDiscount = discountElement && oldPriceElement;
    const oldPrice = hasDiscount ? oldPriceElement.innerText.trim() : "no such element";
    const discount = hasDiscount ? discountElement.innerText.trim() : "no such element";

    const product = { name, price, oldPrice, discount };
    products.push(product);
  });
  return products;
}

async function processPageRange(startPage, endPage) {
  const pagePromises = [];
  for (let page = startPage; page <= endPage; page++) {
    const pageUrl = `${baseUrl}/${page}`;
    pagePromises.push(fetchPageData(pageUrl));
  }
  return Promise.all(pagePromises);
}

async function processAllPages(baseUrl, maxPages) {
  const allProducts = [];
  const pages = Array.from({ length: Math.ceil(maxPages / concurrentRequests) }, (_, i) => i * concurrentRequests + 1);

  for (let i = 0; i < pages.length; i++) {
    const startPage = pages[i];
    const endPage = Math.min(startPage + concurrentRequests - 1, maxPages);
    console.log(`Processing pages ${startPage} to ${endPage}...`);
    const products = await processPageRange(startPage, endPage);
    products.flat().forEach(product => allProducts.push(product));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return allProducts;
}

async function saveToExcel(data, filename) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Price', key: 'price', width: 30 },
    { header: 'Old Price', key: 'oldPrice', width: 20 },
    { header: 'Discount', key: 'discount', width: 20 },
  ];

  data.forEach(product => {
    worksheet.addRow(product);
  });

  await workbook.xlsx.writeFile(filename);
  console.log(`Data saved to ${filename}`);
}

async function main() {
  try {
    const allProducts = await processAllPages(baseUrl, maxPages);
    console.log('Data from all pages:');
    allProducts.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Price: ${product.price}`);
      console.log(`  Old Price: ${product.oldPrice}`);
      console.log(`  Discount: ${product.discount}`);
    });

    if (allProducts.length === 0) {
      console.log('No products found.');
    } else {
      await saveToExcel(allProducts, 'products.xlsx');
    }
  } catch (error) {
    console.error('Error during page processing:', error.message);
  }
}

main();