const cron = require('node-cron');
const bdayService = require('./bdayService');
const { sendBirthdayMessage, sendEventMessage, sendServerMessage } = require('./bdayMessages');

let schedulerStarted = false;

function getDatePartsInTimezone(timezone) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        day: 'numeric',
        month: 'numeric'
    });

    const parts = formatter.formatToParts(new Date());
    const day = Number(parts.find(part => part.type === 'day')?.value);
    const month = Number(parts.find(part => part.type === 'month')?.value);

    return { day, month };
}

function startScheduler(client) {

    if (schedulerStarted) return;
    schedulerStarted = true;

    console.log("📅 Birthday Scheduler started.");

    const schedulerTimezone = process.env.BDAY_TIMEZONE || 'Europe/Berlin';

    cron.schedule('0 1 * * *', async () => {
        try {
            console.log("⏰ Running daily birthday check...");

            const data = bdayService.loadData();
            const { day: todayDay, month: todayMonth } = getDatePartsInTimezone(schedulerTimezone);

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

            // SERVER ANNIVERSARY
            if (data.server && data.server.day === todayDay && data.server.month === todayMonth) {
                try {
                    await sendServerMessage(client);
                } catch (err) {
                    console.error('Error sending server anniversary message:', err);
                }
            }

            bdayService.saveData(data);
        } catch (error) {
            console.error('Scheduler error:', error);
        }
    }, {
        timezone: schedulerTimezone
    });

}

module.exports = { startScheduler };