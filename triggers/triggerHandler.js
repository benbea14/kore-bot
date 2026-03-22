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
    

    try {
        const data = loadTriggers();
        if (!data.enabled || !data.triggers?.length) return;

        // Find all matching triggers for this message
        const matchingTriggers = data.triggers.filter(trigger =>
            trigger.keywords?.some(k => message.content.toLowerCase().includes(k.toLowerCase()))
        );

        if (matchingTriggers.length === 0) return;

        for (const trigger of matchingTriggers) {
            // Check chance
            const roll = Math.random() * 100;
            if (roll > trigger.chance) continue;

            // Get random message from category
            const msgData = dailyService.getRandomMessageByCategory(trigger.category);
            if (!msgData) continue;

            // Replace placeholders
            const finalText = replacePlaceholders(msgData.text, message);

            // Send message
            const { EmbedBuilder } = require('discord.js');

            const embed = new EmbedBuilder()
                .setDescription(finalText)
                .setColor(0x9B59B6)
                .setTimestamp();

            // Select GIF if available
            if (trigger.gif_urls?.length > 0) {
                const gifUrl = trigger.gif_urls[Math.floor(Math.random() * trigger.gif_urls.length)];
                embed.setImage(gifUrl);
            }

            await message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Trigger handler error:', error);
    }
}

module.exports = { handleMessageTrigger };