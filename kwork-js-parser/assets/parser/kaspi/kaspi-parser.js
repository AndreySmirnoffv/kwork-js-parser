const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const cityJson = require('../../cities/city.json');

async function fetchData() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
        { header: 'Название', key: 'title', width: 50 },
        { header: 'Цена', key: 'priceFormatted', width: 15 },
    ];

    const searchCity = cityJson[0].city;
    if (!searchCity) {
        console.log('Город не указан в JSON файле.');
        return;
    }
    console.log(`Город из JSON: ${cityJson[0].city}`);

    const headersMap = {
        'астана': {
            "cookie": "ks.tg=99; k_stat=135f2005-91ae-4e7b-baed-6f2472c53392; kaspi.storefront.cookie.city=710000000"
        },
        'караганда': {
            "cookie": "ks.tg=99; k_stat=135f2005-91ae-4e7b-baed-6f2472c53392; kaspi.storefront.cookie.city=351010000"
        }
    };

    const headers = headersMap[searchCity] || headersMap['караганда'];
    const options = new chrome.Options();
    const driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        await driver.get('https://kaspi.kz');
        await driver.manage().deleteAllCookies();
        for (const cookieKey in headers) {
            const cookies = headers[cookieKey].split('; ').map(cookie => {
                const [name, value] = cookie.split('=');
                return { name, value };
            });
            for (const cookie of cookies) {
                await driver.manage().addCookie(cookie);
            }
        }
        await driver.navigate().refresh();

        for (let i = 1; i < 277; i++) {
            const url = `https://kaspi.kz/shop/c/food/?q=%3AavailableInZones%3AMagnum_ZONE5%3Acategory%3AFood&page=${i}`;
            await driver.get(url);

            try {
                await driver.wait(until.elementLocated(By.css('.item-card')), 10000);
            } catch (e) {
                console.log(`Страница ${i}: Товары не найдены, пропускаем...`);
                continue; 
            }

            const products = await driver.findElements(By.css('.item-card'));

            if (products.length === 0) {
                console.log(`Страница ${i}: Товары не найдены, пропускаем...`);
                continue;
            }

            for (const product of products) {
                try {
                    const title = await product.findElement(By.css('.item-card__name-link')).getText();
                    const priceFormatted = await product.findElement(By.css('.item-card__prices-price')).getText();

                    worksheet.addRow({
                        title: title || 'Нет данных',
                        priceFormatted: priceFormatted || 'Нет данных'
                    });
                } catch (error) {
                    console.log('Ошибка при извлечении данных продукта:', error);
                }
            }

            console.log(`Страница ${i}: Данные добавлены в лист.`);
        }

        const filePath = `${cityJson[0].city}-./kaspi.xlsx`;
        await workbook.xlsx.writeFile(filePath);
        console.log(`Данные успешно сохранены в файл ${filePath}`);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
    } finally {
        await driver.quit();
    }
}

fetchData().catch(error => console.error(error));
