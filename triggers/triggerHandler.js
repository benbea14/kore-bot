// features/triggers/triggerHandler.js
const dailyService = require('../daily/dailyService');
const { loadTriggers } = require('./triggerService');

function getDatePartsInTimezone() {
    const timezone = process.env.DAILY_TIMEZONE || process.env.BDAY_TIMEZONE || 'Europe/Berlin';
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const parts = formatter.formatToParts(new Date());
    const weekday = parts.find(part => part.type === 'weekday')?.value || '';
    const month = parts.find(part => part.type === 'month')?.value || '';
    const day = parts.find(part => part.type === 'day')?.value || '';
    const year = parts.find(part => part.type === 'year')?.value || '';

    return {
        weekday,
        date: `${month}/${day}/${year}`
    };
}

function replacePlaceholders(text, message) {
    const dateParts = getDatePartsInTimezone();

    return text
        .replace(/{server}/gi, message.guild?.name || '')
        .replace(/{day}/gi, dateParts.weekday)
        .replace(/{date}/gi, dateParts.date)
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