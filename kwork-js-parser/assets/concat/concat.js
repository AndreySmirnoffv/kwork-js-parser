const ExcelJS = require('exceljs');
const fs = require('fs');

// Массив файлов для обработки
const files = ['./products-2.xlsx', './products.xlsx', './tovari-2.xlsx', './tovari.xlsx'];

// Функция для сравнения строк по схожести (поиск совпадений по начальным 3 символам)
function areSimilar(str1, str2) {
    if (!str1 || !str2) return false;
    return str1.toLowerCase().startsWith(str2.toLowerCase().slice(0, 3));
}

async function mergeExcelFiles() {
    const mergeWorkbook = new ExcelJS.Workbook();
    const mergedWorksheet = mergeWorkbook.addWorksheet('Merged');

    // Добавляем заголовки таблицы
    mergedWorksheet.columns = [
        { header: 'Озон', key: 'ozon', width: 30 },
        { header: 'Вкусмарт', key: 'vkusmart', width: 30 },
        { header: 'Галмарт', key: 'galmart', width: 30 },
        { header: 'Каспи', key: 'kaspi', width: 30 }
    ];

    const data = {};

    // Читаем данные из каждого файла
    for (const file of files) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(file);
        const worksheet = workbook.getWorksheet(1); // Первая таблица в файле

        console.log(`Чтение данных из файла: ${file}`);

        worksheet.eachRow((row, rowIndex) => {
            const itemName = row.getCell(1).value; // Название продукта в первой колонке
            if (!itemName) {
                console.log(`Пропущена пустая строка в файле ${file} на строке ${rowIndex}`);
                return;
            }

            console.log(`Обработка строки: ${itemName} из файла ${file}`);

            // Ищем похожие товары в уже существующих данных
            let matchedKey = Object.keys(data).find(key => areSimilar(key, itemName));
            if (!matchedKey) {
                // Если похожий товар не найден, создаем новую запись
                matchedKey = itemName;
                data[matchedKey] = { ozon: '', vkusmart: '', galmart: '', kaspi: '' };
            }

            // Определяем, в какую колонку записывать в зависимости от названия файла
            if (file.includes('ozon')) {
                data[matchedKey].ozon = itemName;
            } else if (file.includes('vkusmart')) {
                data[matchedKey].vkusmart = itemName;
            } else if (file.includes('galmart')) {
                data[matchedKey].galmart = itemName;
            } else if (file.includes('kaspi')) {
                data[matchedKey].kaspi = itemName;
            }
        });
    }

    // Заполняем объединённую таблицу
    Object.keys(data).forEach(key => {
        console.log(`Добавление строки: Озон: ${data[key].ozon}, Вкусмарт: ${data[key].vkusmart}, Галмарт: ${data[key].galmart}, Каспи: ${data[key].kaspi}`);
        mergedWorksheet.addRow(data[key]);
    });

    // Сохраняем итоговый файл
    await mergeWorkbook.xlsx.writeFile('merge.xlsx');
    console.log('Данные объединены и записаны в merge.xlsx');
}

mergeExcelFiles().catch(console.error);
