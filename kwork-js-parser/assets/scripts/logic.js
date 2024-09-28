const city = require('./city.json');
const fs = require('fs');
const { waitForText } = require('./waitForText.js');

async function changeCity(bot, msg) {
    await bot.sendMessage(msg.chat.id, "Теперь напишите город");

    // Wait for the user's response
    const userInput = await waitForText(bot, msg.chat.id);

    // Check if userInput is empty or undefined
    if (!userInput || userInput.trim() === '') {
        await bot.sendMessage(msg.chat.id, "Город не может быть пустым. Пожалуйста, введите правильное название города.");
        return;  // Stop execution if the input is invalid
    }

    // Find the city to change (assuming city is an object or array)
    const cityToChange = city.find(city => city);  // Adjust this logic if needed

    // Check if cityToChange is found
    if (!cityToChange) {
        await bot.sendMessage(msg.chat.id, "Ошибка: не удалось найти город.");
        return;
    }

    // Update the city field with user input
    cityToChange.city = userInput.trim();  // Trim whitespace for better consistency

    // Write the updated city data back to the file
    fs.writeFileSync('./city.json', JSON.stringify(city, null, '\t'));

    // Confirm to the user that the city has been updated
    await bot.sendMessage(msg.chat.id, `Город успешно изменён на ${userInput.trim()}`);
}

module.exports = { changeCity: changeCity };
