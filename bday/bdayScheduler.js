const cron = require('node-cron');
const bdayService = require('./bdayService');
const { sendBirthdayMessage, sendEventMessage } = require('./bdayMessages');

let schedulerStarted = false;

function startScheduler(client) {

    if (schedulerStarted) return;
    schedulerStarted = true;

    console.log("📅 Birthday Scheduler started.");

    cron.schedule('0 0 * * *', async () => {
        try {
            console.log("⏰ Running daily birthday check...");

            const data = bdayService.loadData();
            const today = new Date();

            const todayDay = today.getDate();
            const todayMonth = today.getMonth() + 1;

            // BIRTHDAYS
            for (const entry of data.birthdays) {
                if (entry.day === todayDay && entry.month === todayMonth) {
                    try {
                        await sendBirthdayMessage(client, entry);
                    } catch (err) {
                        console.error(`Error sending birthday message for ${entry.name || entry.userId}:`, err);
                    }
                }
            }

            // EVENTS
            const remainingEvents = [];

            for (const event of data.events) {
                if (event.day === todayDay && event.month === todayMonth) {
                    try {
                        await sendEventMessage(client, event);
                    } catch (err) {
                        console.error(`Error sending event message for ${event.name}:`, err);
                    }

                    if (event.recurring) {
                        remainingEvents.push(event);
                    }
                } else {
                    remainingEvents.push(event);
                }
            }

            data.events = remainingEvents;
            bdayService.saveData(data);

            // SERVER ANNIVERSARY
            if (data.server && data.server.day === todayDay && data.server.month === todayMonth) {
                try {
                    const channel = client.channels.cache.get(data.settings?.reminderChannelId);
                    if (channel) {
                        await channel.send(`🎉 Happy Server Anniversary! 💜`);
                    }
                } catch (err) {
                    console.error('Error sending server anniversary message:', err);
                }
            }

            bdayService.saveData(data);
        } catch (error) {
            console.error('Scheduler error:', error);
        }
    }, {
        timezone: "Europe/Berlin"
    });

}

module.exports = { startScheduler };