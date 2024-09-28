const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const XLSX = require('xlsx');
const chrome = require('selenium-webdriver/chrome');

const inputFilePath = './galmart.kz_internal_links.txt';
const catalogPath = '/catalog/';  // Путь, который должен содержаться в URL

// Функция для создания Excel файла
function createExcelFile(items) {
    if (items.length === 0) {
        console.log('Нет данных для сохранения в Excel.');
        return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(items, { header: ['name', 'price'], skipHeader: false });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    const filePath = './galmart.xlsx';
    XLSX.writeFile(workbook, filePath);
    console.log(`Excel файл сохранен как ${filePath}`);
}

async function setCookies(driver) {

    await driver.get('https://galmart.kz');

    const cookies = [
        {
            name: 'csrftoken',
            value: '4Cu3KLNoFYUM0u8U1hTdEOnUvav3FFYC',
            domain: 'galmart.kz',
            path: '/',
            secure: true,
            httpOnly: true
        },
        {
            name: 'sessionid',
            value: 'ypidniiaptm6phm4dtekl8k9xvcdjy4p',
            domain: 'galmart.kz',
            path: '/',
            secure: true,
            httpOnly: true
        },
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
            const loadMoreButtonExists = await driver.findElements(By.id('load_more')).then(elements => elements.length > 0);

            if (loadMoreButtonExists) {
                const loadMoreButton = await driver.findElement(By.id('load_more'));
                await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', loadMoreButton);
                await driver.sleep(1000);

                const isButtonEnabled = await loadMoreButton.isEnabled();
                if (isButtonEnabled) {
                    await loadMoreButton.click();
                    await driver.sleep(3000);
                } else {
                    console.log("Кнопка 'Load More' неактивна.");
                    break;
                }
            } else {
                console.log("Кнопка 'Load More' не найдена.");
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
            await driver.wait(until.elementLocated(By.css('.product')), 10000);
            success = true;
        } catch (e) {
            console.log(`Ошибка при загрузке страницы ${url}:`, e);
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
    const productElements = await driver.findElements(By.css('.product'));

    for (const product of productElements) {
        try {
            const nameElement = await product.findElement(By.css('.name'));
            const priceElement = await product.findElement(By.css('.value'));
            if (nameElement && priceElement) {
                const name = await nameElement.getText();
                const price = await priceElement.getText();
                items.push({
                    name: name.trim(),
                    price: price.trim()
                });
            }
        } catch (e) {
            console.log('Ошибка при извлечении данных из элемента продукта:', e);
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
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    await setCookies(driver);

    const allItems = [];
    const links = fs.readFileSync(inputFilePath, 'utf-8').split('\n').filter(link => link);

    for (let i = 0; i < links.length; i++) {
        const link = links[i].trim();
        const isLastLink = i === links.length - 1;
        await processLink(link, driver, allItems, isLastLink);
    }

    console.log(`Всего найдено ${allItems.length} товаров.`); 

    createExcelFile(allItems);

    await driver.quit();
    await driver.close()
    console.log('Все ссылки обработаны.');
})();
