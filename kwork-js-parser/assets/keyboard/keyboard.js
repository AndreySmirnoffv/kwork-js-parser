module.exports = {
    landKeyboard: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: "Озон астана", callback_data: "ozonastana"}, {text: "Озон караганда", callback_data: "ozonkaraganda"}],
                [{text: "Каспи астана", callback_data: "kaspiastana"}, {text: "Каспи караганда", callback_data: "kaspikaraganda"}]
            ]
        })
    }
}