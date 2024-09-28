const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const ExcelJS = require('exceljs');
const cityJson = require('../../cities/city.json');

async function fetchData() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
        { header: 'Название', key: 'title', width: 50 },
        { header: 'Цена', key: 'priceFormatted', width: 15 },
        { header: 'Цена со скидкой', key: 'discountPrice', width: 15 },
        { header: 'Процент скидки', key: 'discountPercentage', width: 20 }
    ];

    const searchCity = cityJson[0].city;
    if (!searchCity) {
        console.log('Город не указан в JSON файле.');
        return;
    }
    console.log(`Город из JSON: ${cityJson[0].city}`);

    const headersMap = {
        'астана': {
            ":authority": "xapi.ozon.kz",
            ":method": "POST",
            ":path": "/perf-metrics-collector/v4/rum/bx/web",
            ":scheme":"https",
            "accept": '*/*',
            "accept-encoding":
            "gzip, deflate, br, zstd",
            "accept-language": "en-US,en;q=0.9",
            "content-length": "6227",
            "content-type": "text/plain;charset=UTF-8",
            "cookie": "__Secure-access-token=6.0.tk5zYSiKRvObOKuR4XIiBg.43.AfrMzMy2051LF8d4hUULsf9OdXKnfOrtvgSsesJkkWDnq4tVsbUFRTQyD-Dqx1x_vw..20240925160720.SzwrmBqiZO-wKNL3lkXl4utr0m0mXkIJdI4q_L20i4Y.17bebae37677212bb; __Secure-ab-group=43; __Secure-refresh-token=6.0.tk5zYSiKRvObOKuR4XIiBg.43.AfrMzMy2051LF8d4hUULsf9OdXKnfOrtvgSsesJkkWDnq4tVsbUFRTQyD-Dqx1x_vw..20240925160720.NEnIMjHiNbA--Cdf0RD7CQPvMi8UEKgDKCUAx4HJeyA.1bd1da87034c4b05d; __Secure-user-id=0; xcid=a673f44cac1f6b42780af020b65b7a08; __Secure-ext_xcid=a673f44cac1f6b42780af020b65b7a08; rfuid=NjkyNDcyNDUyLDEyNC4wNDM0NzUyNzUxNjA3NCwxMDI4MjM3MjIzLC0xLC00NjkzMDg5NTMsVzNzaWJtRnRaU0k2SWxCRVJpQldhV1YzWlhJaUxDSmtaWE5qY21sd2RHbHZiaUk2SWxCdmNuUmhZbXhsSUVSdlkzVnRaVzUwSUVadmNtMWhkQ0lzSW0xcGJXVlVlWEJsY3lJNlczc2lkSGx3WlNJNkltRndjR3hwWTJGMGFXOXVMM0JrWmlJc0luTjFabVpwZUdWeklqb2ljR1JtSW4wc2V5SjBlWEJsSWpvaWRHVjRkQzl3WkdZaUxDSnpkV1ptYVhobGN5STZJbkJrWmlKOVhYMHNleUp1WVcxbElqb2lRMmh5YjIxbElGQkVSaUJXYVdWM1pYSWlMQ0prWlhOamNtbHdkR2x2YmlJNklsQnZjblJoWW14bElFUnZZM1Z0Wlc1MElFWnZjbTFoZENJc0ltMXBiV1ZVZVhCbGN5STZXM3NpZEhsd1pTSTZJbUZ3Y0d4cFkyRjBhVzl1TDNCa1ppSXNJbk4xWm1acGVHVnpJam9pY0dSbUluMHNleUowZVhCbElqb2lkR1Y0ZEM5d1pHWWlMQ0p6ZFdabWFYaGxjeUk2SW5Ca1ppSjlYWDBzZXlKdVlXMWxJam9pUTJoeWIyMXBkVzBnVUVSR0lGWnBaWGRsY2lJc0ltUmxjMk55YVhCMGFXOXVJam9pVUc5eWRHRmliR1VnUkc5amRXMWxiblFnUm05eWJXRjBJaXdpYldsdFpWUjVjR1Z6SWpwYmV5SjBlWEJsSWpvaVlYQndiR2xqWVhScGIyNHZjR1JtSWl3aWMzVm1abWw0WlhNaU9pSndaR1lpZlN4N0luUjVjR1VpT2lKMFpYaDBMM0JrWmlJc0luTjFabVpwZUdWeklqb2ljR1JtSW4xZGZTeDdJbTVoYldVaU9pSk5hV055YjNOdlpuUWdSV1JuWlNCUVJFWWdWbWxsZDJWeUlpd2laR1Z6WTNKcGNIUnBiMjRpT2lKUWIzSjBZV0pzWlNCRWIyTjFiV1Z1ZENCR2IzSnRZWFFpTENKdGFXMWxWSGx3WlhNaU9sdDdJblI1Y0dVaU9pSmhjSEJzYVdOaGRHbHZiaTl3WkdZaUxDSnpkV1ptYVhobGN5STZJbkJrWmlKOUxIc2lkSGx3WlNJNkluUmxlSFF2Y0dSbUlpd2ljM1ZtWm1sNFpYTWlPaUp3WkdZaWZWMTlMSHNpYm1GdFpTSTZJbGRsWWt0cGRDQmlkV2xzZEMxcGJpQlFSRVlpTENKa1pYTmpjbWx3ZEdsdmJpSTZJbEJ2Y25SaFlteGxJRVJ2WTNWdFpXNTBJRVp2Y20xaGRDSXNJbTFwYldWVWVYQmxjeUk2VzNzaWRIbHdaU0k2SW1Gd2NHeHBZMkYwYVc5dUwzQmtaaUlzSW5OMVptWnBlR1Z6SWpvaWNHUm1JbjBzZXlKMGVYQmxJam9pZEdWNGRDOXdaR1lpTENKemRXWm1hWGhsY3lJNkluQmtaaUo5WFgxZCxXeUpsYmkxVlV5SmQsMSwxLDAsMjQsMTQyNzUsOCwyMjcxMjY1MjAsMCwxLDAsLTQ5MTI3NTUyMyxSMjl2WjJ4bElFbHVZeTRnVG1WMGMyTmhjR1VnUjJWamEyOGdUR2x1ZFhnZ2VEZzJYelkwSURVdU1DQW9XREV4T3lCTWFXNTFlQ0I0T0RaZk5qUXBJRUZ3Y0d4bFYyVmlTMmwwTHpVek55NHpOaUFvUzBoVVRVd3NJR3hwYTJVZ1IyVmphMjhwSUVOb2NtOXRaUzh4TWprdU1DNHdMakFnVTJGbVlYSnBMelV6Tnk0ek5pQXlNREF6TURFd055Qk5iM3BwYkd4aCxleUpqYUhKdmJXVWlPbnNpWVhCd0lqcDdJbWx6U1c1emRHRnNiR1ZrSWpwbVlXeHpaU3dpU1c1emRHRnNiRk4wWVhSbElqcDdJa1JKVTBGQ1RFVkVJam9pWkdsellXSnNaV1FpTENKSlRsTlVRVXhNUlVRaU9pSnBibk4wWVd4c1pXUWlMQ0pPVDFSZlNVNVRWRUZNVEVWRUlqb2libTkwWDJsdWMzUmhiR3hsWkNKOUxDSlNkVzV1YVc1blUzUmhkR1VpT25zaVEwRk9UazlVWDFKVlRpSTZJbU5oYm01dmRGOXlkVzRpTENKU1JVRkVXVjlVVDE5U1ZVNGlPaUp5WldGa2VWOTBiMTl5ZFc0aUxDSlNWVTVPU1U1SElqb2ljblZ1Ym1sdVp5SjlmWDE5LDY1LC05NjYwNDkyMzMsMSwxLC0xLDE2OTk5NTQ4ODcsMTY5OTk1NDg4NywtMTQ2MTUxODEyLDEy; abt_data=7.yPKcjvxvqDDz2F9Qdc-QAMP6-bE_A2W0pTL7ks8xR1nTEgc5qpP07KrhnRdPPBpfGfIEj3nMsQn6waddgi_ZRuVSbqmmEp-b9t7lh3EfWnOGK8nSSTkVnKF9EDokk1gTTuRNtlEYvlQMWmozV_Ny3L8jb15RPaMZ_m6YSGKdXIYI2KL6nuA6hdCEhqx9uhR9u9PmRRRaI0gwpjmJ8IZpFmNGaeW5aemoRRXH1IdwmKqrgYOMvrMfDorhKzguzIuXVSebY0ndL0Qw-CvIzMJXwmD3uZW5iC5Jrov9yH0IOjxOAHHKUbSe4TMQcdFtMRZyHLPLUx2hNp8TAnKShRIimwpCWIFIxxVHTIlKn190ELkMoBI2-FpreSI97hsex7YfPsDcFiTr-myivqmBOx0fg13f4hP8uGAv",
            "origin": "https://ozon.kz",
            "priority": "u=4, i",
            "referer": "https://ozon.kz/",
            "sec-ch-ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "Linux",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "no-cors",
            "sec-fetch-site": "same-site",
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"

        },
        'караганда': {
            "Cookie": "abt_data=7.I51z-vOKTb3udwFZqQxBcB9IWfA_D7ZFAF4Y0ZXdMVTi701w5d76kEa3SU53aIqQEKrKiYU7Sx3_VdlGCUx3U6GU2O3o11NI70xM1i4KnRQVykpy4m0leFGmWKRtdoTv1j38qyauv8mbIZDaV7hPk0uzEF9ctbtd5eSiTWUQ-pNE2E8N375s7-X47lP07zoPdd7FmuiCgaE18xXWP9FKZvhC_SXQ-PRln_t37WsS_CYySxdvZ9rUrzwi6gciLitYJOgjMt9DKDmMeIt6yG3U5Yhk5Aa9xnogDW_wjQZoP1T3-x95GXdUJQ79dwC-F9k9hMFn8pKEWm1EvZR9xk_tE4jWl6qKsizI0Fb05FbBtxUgD6DeemvD7uLLROuRiW5NGoVF-1ooUyJcdUgFiZVPMCVbWmp_Nn6tYJDAqICPd2ChS1bV21czwIMF2Q; xcid=d8aa58c7db5c94a0a9ecea663f1fa389; __Secure-ext_xcid=…ElFUnZZM1Z0Wlc1MElFWnZjbTFoZENJc0ltMXBiV1ZVZVhCbGN5STZXM3NpZEhsd1pTSTZJbUZ3Y0d4cFkyRjBhVzl1TDNCa1ppSXNJbk4xWm1acGVHVnpJam9pY0dSbUluMHNleUowZVhCbElqb2lkR1Y0ZEM5d1pHWWlMQ0p6ZFdabWFYaGxjeUk2SW5Ca1ppSjlYWDFkLFd5SmxiaTFWVXlJc0ltVnVMVlZUSWl3aVpXNGlYUT09LDAsMSwwLDI0LDIzNzQxNTkzMCwtMSwyMjcxMjY1MjAsMCwxLDAsLTQ5MTI3NTUyMyxJRTVsZEhOallYQmxJRWRsWTJ0dklFeHBiblY0SUhnNE5sODJOQ0ExTGpBZ0tGZ3hNU2tnTWpBeE1EQXhNREVnVFc5NmFXeHNZUT09LGUzMD0sNjUsLTk2NjA0OTIzMywxLDEsLTEsMTY5OTk1NDg4NywxNjk5OTU0ODg3LC0xNDYxNTE4MTIsMTI=; guest=true",

        }
    };

    const headers = headersMap[searchCity] || headersMap['караганда'];
    const options = new chrome.Options();
    const driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        await driver.get('https://www.ozon.kz');
        await driver.manage().deleteAllCookies();
        await driver.sleep(10000);

        setTimeout(() => {}, 5000)
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

        let baseUrl = 'https://ozon.kz/category/produkty-pitaniya-9200/';
        let pageNumber = 1;

        while (pageNumber <= 277) {
            const url = `${baseUrl}?page=${pageNumber}`;
            console.log('Открываем URL:', url);
            await driver.get(url);
            await driver.wait(until.elementLocated(By.css('.widget-search-result-container')), 10000);

            const items = await driver.findElements(By.css('.widget-search-result-container'));
            for (const item of items) {
                try {
                    const title = await item.findElement(By.css('.tsBody500Medium')).getText();
                    const priceFormatted = await item.findElement(By.css('.c3015-a1 tsHeadline500Medium c3015-c0')).getText();
                    const discountPrice = await item.findElement(By.css('.c3015-a1 tsBodyControl400Small c3015-b0')).getText();
                    const discountPercentage = await item.findElement(By.css('.tsBodyControl400Small c3015-a2 c3015-a7.c3015-b1')).getText();

                    worksheet.addRow({
                        title: title || 'Нет данных',
                        priceFormatted: priceFormatted || 'Нет данных',
                        discountPrice: discountPrice || 'Нет данных',
                        discountPercentage: discountPercentage || 'Нет данных'
                    });
                } catch (error) {
                    console.log('Ошибка при извлечении данных продукта:', error);
                }
            }

            console.log(`Страница ${pageNumber}: Данные добавлены в лист.`);
            pageNumber++;
            await driver.sleep(10000); // Задержка между страницами
        }

        const filePath = './ozon.xlsx';
        await workbook.xlsx.writeFile(filePath);
        driver.close()
        driver.quit()
        console.log(`Данные успешно сохранены в файл ${filePath}`);
    } catch (error) {
        driver.close()
        driver.quit()
        console.error('Ошибка при выполнении запроса:', error);
    } finally {
        await driver.close()
        await driver.quit();
    }
}

fetchData().catch(error => console.error(error));
