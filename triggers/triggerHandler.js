// features/triggers/triggerHandler.js
const dailyService = require('../daily/dailyService');
const { loadTriggers } = require('./triggerService');

function replacePlaceholders(text, message) {
    return text
        .replace(/{server}/gi, message.guild?.name || '')
        .replace(/{day}/gi, new Date().toLocaleDateString('en-US', { weekday: 'long' }))
        .replace(/{date}/gi, new Date().toLocaleDateString())
        .replace(/{user}/gi, message.author.username)
        .replace(/{user.role=ARMY}/gi, message.member?.roles.cache.some(r => r.name === 'ARMY') ? message.author.username : '');
}

async function handleMessageTrigger(client, message) {
    if (message.author.bot) return;

    const data = loadTriggers();
    if (!data.enabled) return; // Trigger global off

    // Finde alle passenden Trigger für diese Nachricht
    const triggers = data.triggers.filter(trigger =>
        trigger.keywords.some(k => message.content.toLowerCase().includes(k))
    );

    for (const trigger of triggers) {
        // Chance prüfen
        const roll = Math.random() * 100;
        if (roll > trigger.chance) continue;

        // Nachricht aus Kategorie ziehen
        const msgData = dailyService.getRandomMessageByCategory(trigger.category);
        if (!msgData) continue;

        // Platzhalter ersetzen
        const finalText = replacePlaceholders(msgData.text, message);

        // GIF auswählen, falls vorhanden
        let files = [];
        if (trigger.gif_urls && trigger.gif_urls.length > 0) {
            const gifUrl = trigger.gif_urls[Math.floor(Math.random() * trigger.gif_urls.length)];
            files.push(gifUrl);
        }

        // Nachricht senden
        const { EmbedBuilder } = require('discord.js');

        const embed = new EmbedBuilder()
            .setDescription(content)  // content = Nachricht, die du normalerweise sendest
            .setColor(0x9B59B6);

        await channel.send({ embeds: [embed] });
    }
}

module.exports = { handleMessageTrigger };