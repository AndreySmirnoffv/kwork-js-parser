const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot(process.env.TOKEN, {polling: true})

bot.on('message', async msg => {
    if (msg.text === '/start'){
        await bot.sendDocument(process.env.CHANNEL_ID, "./products.xlsx")
    }else if(msg.text === '/sendfile'){
        await bot.sendDocument(process.env.CHANNEL_ID, "sendFiles")
    }
})

bot.on('polling_error', console.log)