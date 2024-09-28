const { By, Builder, until } = require('selenium-webdriver');
const fs = require('fs');
const XLSX = require('xlsx');
const chrome = require('selenium-webdriver/chrome');

const inputFilePath = './vkusmart.vmv.kz_internal_links.txt';
const catalogPath = '/catalog/';

function createExcelFile(items) {
    if (items.length === 0) {
        return console.log('Нет данных для сохранения в Excel');
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(items, { header: ['name', 'price'], skipHeader: false });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    const filePath = './vkusmart.xlsx';
    XLSX.writeFile(workbook, filePath);
    console.log(`Excel файл сохранен как ${filePath}`);
}

async function setCookies(driver) {
    await driver.get('https://vkusmart.vmv.kz');

    const cookies = [
       
    ];

    for (const cookie of cookies) {
        await driver.manage().addCookie(cookie);
    }

    await driver.navigate().refresh();
}

async function scrollToTop(driver) {
    await driver.executeScript('window.scrollTo(0, 0)');
    await driver.sleep(1000);
}

async function clickLoadMore(driver) {
    while (true) {
        await driver.executeScript('window.scrollBy(0, window.innerHeight)');
        await driver.sleep(3000);

        try {
            const loadMoreButton = await driver.findElement(By.className('ajax_load_btn'));

            const isDisplayed = await loadMoreButton.isDisplayed();
            console.log(`Кнопка "Load More" видима: ${isDisplayed}`);

            if (isDisplayed) {
                await driver.executeScript('arguments[0].scrollIntoView(true);', loadMoreButton);
                await driver.sleep(1000);
                await loadMoreButton.click();
                await driver.sleep(3000); 
            } else {
                console.log('Кнопка "Load More" не видима, прерывание...');
                break;
            }
        } catch (error) {
            console.error('Ошибка при попытке кликнуть на кнопку "Load More" или кнопка не найдена:', error);
            break;
        }
    }
}

async function processPage(driver, url) {
    console.log(`Обработка страницы: ${url}`);

    const maxRetries = 2;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
        try {
            await driver.get(url);
            await driver.wait(until.elementLocated(By.css('.inner_wrap')), 10000);
            success = true;
        } catch (error) {
            console.log(`Ошибка при загрузке страницы ${url}:`, error);
            attempt++;
            if (attempt < maxRetries) {
                console.log(`Повторная попытка (${attempt}/${maxRetries})...`);
                await driver.sleep(5000);
            } else {
                console.log(`Не удалось загрузить страницу после ${maxRetries} попыток.`);
                return [];
            }
        }
    }

    await driver.executeScript('document.body.style.cursor = "none";');

    await scrollToTop(driver);
    await clickLoadMore(driver);

    await driver.executeScript(`
        let lastHeight = document.body.scrollHeight;
        while (true) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, 1000));
            let newHeight = document.body.scrollHeight;
            if (newHeight === lastHeight) break;
            lastHeight = newHeight;
        }
    `);

    let items = [];
    const productElements = await driver.findElements(By.css('.inner_wrap'));

    for (const product of productElements) {
        try {
            const nameElement = await product.findElement(By.css('.item-title'));
            const priceElement = await product.findElement(By.css('.price_value'));
            if (nameElement && priceElement) {
                const name = await nameElement.getText();
                const price = await priceElement.getText();
                items.push({
                    name: name.trim(),
                    price: price.trim()
                });
            }
        } catch (error) {
            console.log('Ошибка при извлечении данных из элемента продукта:', error);
        }
    }

    console.log(`Найдено ${items.length} товаров на странице.`);
    return items;
}


async function processLink(link, driver, allItems, isLastLink) {
    if (!link.includes(catalogPath)) {
        console.log(`Ссылка пропущена (не содержит "${catalogPath}"): ${link}`);
        return;
    }

    try {
        const items = await processPage(driver, link);
        allItems.push(...items);

        if (isLastLink) {
            console.log(`Последняя ссылка обработана: ${link}`);
        } else {
            console.log(`Обработана ссылка: ${link}`);
        }
    } catch (error) {
        console.log(`Ошибка при обработке ${link}:`, error);
    }
}

(async () => {
    const options = new chrome.Options();
    // options.addArguments('--headless'); 
    options.addArguments('--disable-gpu'); 
    options.addArguments('--no-sandbox'); 
    options.addArguments('--window-size=1920x1080');

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    await setCookies(driver);

    const allItems = [];
    const links = fs.readFileSync(inputFilePath, 'utf-8').split('\n').filter(link => link);

    for (let i = 0; i < links.length; i++) {
        const link = links[i].trim();
        
        if (!link.includes(catalogPath)) {
            console.log(`Ссылка пропущена (не содержит "${catalogPath}"): ${link}`);
            continue;  
        }
    
        const isLastLink = i === links.length - 1;
        await processLink(link, driver, allItems, isLastLink);
    }
    
    console.log(`Всего найдено ${allItems.length} товаров.`);  

    createExcelFile(allItems);

    await driver.quit();
    console.log('Все ссылки обработаны.');
})();
