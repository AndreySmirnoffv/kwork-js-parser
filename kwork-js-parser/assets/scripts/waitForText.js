async function waitForText(bot, chatId) {
    return new Promise((resolve, reject) => {
        const onMessage = (msg) => {
            if (msg.chat.id === chatId && msg.text) {
                bot.removeListener('message', onMessage); // Убираем слушатель после получения сообщения
                resolve(msg.text); // Сообщение получено, разрешаем промис
            }
        };

        bot.on('message', onMessage); 

        setTimeout(() => {
            bot.removeListener('message', onMessage);
            reject(new Error('Timeout waiting for text'));
        }, 60000); 
    });
}


module.exports = {
    waitForText: waitForText
}