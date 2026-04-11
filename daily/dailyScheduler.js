// daily/dailyScheduler.js
const cron = require('node-cron');
const dailyService = require('./dailyService');
const { formatMessage } = require('./dailyMessages');

let schedulerStarted = false;

function getTimePartsInTimezone(timezone) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(new Date());
    const hour = Number(parts.find(part => part.type === 'hour')?.value);
    const minute = Number(parts.find(part => part.type === 'minute')?.value);

    return { hour, minute };
}

function startDailyScheduler(client) {
    if (schedulerStarted) return;
    schedulerStarted = true;

    const schedulerTimezone = process.env.DAILY_TIMEZONE || process.env.BDAY_TIMEZONE || 'Europe/Berlin';

    cron.schedule('0 * * * * *', async () => {
        try {
            const data = dailyService.loadData();
            if (!data.enabled || !data.channel_id) return;

            const { hour: currentHour, minute: currentMinute } = getTimePartsInTimezone(schedulerTimezone);

            const slotMatches = data.slots?.filter(slot =>
                slot.hour === currentHour &&
                slot.minute === currentMinute
            ) || [];

            if (slotMatches.length === 0) return;

            const channel = client.channels.cache.get(data.channel_id);
            if (!channel) return;

            const guild = channel.guild;
            if (!guild) return;

            const { EmbedBuilder } = require('discord.js');

            for (const slot of slotMatches) {
                const messageData = dailyService.getRandomMessageByCategory(slot.category);
                if (!messageData) continue;

                const formattedText = formatMessage(messageData.text, guild, false);

                const embed = new EmbedBuilder()
                    .setDescription(formattedText)
                    .setColor(0x9B59B6)
                    .setTimestamp();

                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Daily scheduler error:', error);
        }
    }, {
        timezone: schedulerTimezone
    });
}

module.exports = {
    startDailyScheduler
};