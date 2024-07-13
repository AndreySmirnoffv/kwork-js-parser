const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot("7079173737:AAECH7v7Jy4imHqLvWqVg87RWls55bqJYMw", {polling: true})

bot.on('message', async msg => {
    const CHANNEL_ID = -1004203613710
    if (msg.text === '/start'){
        await bot.sendDocument(CHANNEL_ID, "./products.xlsx")
    }
})

bot.on('polling_error', console.log)