const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const { changeCity } = require('./assets/scripts/logic.js');
const bot = new TelegramBot("7222878293:AAGj1xQFsy9wQE5DG00E28GoLolHfgGaAj8", { polling: true });

const commands = [
    { command: "start", description: "Начало работы с ботом" },
    { command: "ozon", description: "Получить данные по Озон" },
    { command: "kaspi", description: "Получить данные по Каспи" },
    { command: "tovari", description: "Получить данные по товарам" }
];
bot.setMyCommands(commands)
    .then(() => console.log("Команды успешно установлены."))
    .catch((err) => console.error("Ошибка при установке команд:", err));

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const fileName = "./" + msg.text + ".xlsx";
    const filePath = path.resolve(__dirname, fileName);

    if (msg.text === '/start') {
        await bot.sendMessage(chatId, "Начните парс командой node имя_файла.js, затем пришлите мне команду того, чего парсили, например /ozon");
    } else if (fs.existsSync(filePath)) {
        await bot.sendDocument(chatId, filePath)
            .catch(err => console.log("Ошибка отправки файла:", err));
    } else if (msg.text === "/city") {
        changeCity(bot, msg)
    } else {

        await bot.sendMessage(chatId, "Файл не найден.");
    }
});

bot.on('polling_error', (error) => console.log(error));
