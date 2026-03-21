// daily/dailyScheduler.js
const dailyService = require('./dailyService');
const { formatMessage } = require('./dailyMessages');

function startDailyScheduler(client) {

    setInterval(async () => {

        const data = dailyService.loadData();
        if (!data.enabled || !data.channel_id) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const slotMatch = data.slots.find(slot =>
            slot.hour === currentHour &&
            slot.minute === currentMinute
        );

        if (!slotMatch) return;

        const channel = client.channels.cache.get(data.channel_id);
        if (!channel) return;

        const messageData = dailyService.getRandomMessageByCategory(slotMatch.category);
        if (!messageData) return;

        // Prüfen, ob die Nachricht als Embed gesendet werden soll
        const { EmbedBuilder } = require('discord.js');

        const embed = new EmbedBuilder()
            .setDescription(formattedText)
            .setColor(0x9B59B6)
            .setTimestamp();

        await channel.send({ embeds: [embed] });

    }, 60 * 1000); // check every minute
}

module.exports = {
    startDailyScheduler
};