// daily/dailyScheduler.js
const dailyService = require('./dailyService');
const { formatMessage } = require('./dailyMessages');

function startDailyScheduler(client) {

    setInterval(async () => {
        try {
            const data = dailyService.loadData();
            if (!data.enabled || !data.channel_id) return;

            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            const slotMatch = data.slots?.find(slot =>
                slot.hour === currentHour &&
                slot.minute === currentMinute
            );

            if (!slotMatch) return;

            const channel = client.channels.cache.get(data.channel_id);
            if (!channel) return;

            const messageData = dailyService.getRandomMessageByCategory(slotMatch.category);
            if (!messageData) return;

            const guild = channel.guild;
            if (!guild) return;

            const formattedText = formatMessage(messageData.text, guild, false);
            const { EmbedBuilder } = require('discord.js');

            const embed = new EmbedBuilder()
                .setDescription(formattedText)
                .setColor(0x9B59B6)
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Daily scheduler error:', error);
        }
    }, 60 * 1000); // check every minute
}

module.exports = {
    startDailyScheduler
};