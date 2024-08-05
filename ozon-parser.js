const { chromium } = require('playwright');
const ExcelJS = require('exceljs');

const baseUrl = 'https://ozon.kz/category/produkty-pitaniya-9200';
const maxPages = 278; 
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

        // Wait for the product cards to be loaded
        await page.waitForSelector('.m3j_23');

        data = await page.evaluate(() => {
          const products = [];
          document.querySelectorAll('.m3j_23').forEach(card => {
            const name = card.querySelector('.tsBody500Medium')?.innerText.trim();
            const price = card.querySelector('.c3013-a1.tsHeadline500Medium.c3013-c0')?.innerText.trim();
            const oldPriceElement = card.querySelector('.c3013-a1.tsBodyControl400Small.c3013-b0');
            const oldPrice = oldPriceElement ? oldPriceElement.innerText.trim() : "";

            // Debug output to verify selectors
            console.log(`Extracted product - Name: ${name}, Price: ${price}, Old Price: ${oldPrice}`);

            const product = { name, price, oldPrice };
            products.push(product);
          });
          return products;
        });

        if (data.length === 0) {
          console.warn(`No products found on ${url}`);
        }

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

async function processPageRange(startPage, endPage) {
  const pagePromises = [];
  for (let page = startPage; page <= endPage; page++) {
    const pageUrl = `${baseUrl}/?page=${page}`;
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
    });

    if (allProducts.length === 0) {
      console.log('No products found.');
    } else {
      await saveToExcel(allProducts, `ozon-products.xlsx`);
    }
  } catch (error) {
    console.error('Error during page processing:', error.message);
  }
}

main();
