// daily/dailyMessages.js
const { EmbedBuilder } = require('discord.js');

function formatMessage(template, guild, useEmbed = false) {
    const now = new Date();

    const replacements = {
        "{server}": guild.name,
        "{day}": now.toLocaleDateString('en-EN', { weekday: 'long' }),
        "{date}": now.toLocaleDateString('en-EN')
    };

    let text = template;
    for (const key in replacements) {
        text = text.replaceAll(key, replacements[key]);
    }

    if (useEmbed) {
        return new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(text)
            .setTimestamp();
    }

    return text;
}

module.exports = {
    formatMessage
};