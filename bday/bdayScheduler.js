const cron = require('node-cron');
const bdayService = require('./bdayService');
const { sendBirthdayMessage, sendEventMessage } = require('./bdayMessages');

let schedulerStarted = false;

function startScheduler(client) {

    if (schedulerStarted) return;
    schedulerStarted = true;

    console.log("📅 Birthday Scheduler started.");

    cron.schedule('0 0 * * *', async () => {

    console.log("⏰ Running daily birthday check...");

    const data = bdayService.loadData();
    const today = new Date();

    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    // BIRTHDAYS
    for (const entry of data.birthdays) {
        if (entry.day === todayDay && entry.month === todayMonth) {
            await sendBirthdayMessage(client, entry);
        }
    }

    // EVENTS
    const remainingEvents = [];

    for (const event of data.events) {
        if (event.day === todayDay && event.month === todayMonth) {
            await sendEventMessage(client, event);

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
        if (data.server &&
            data.server.day === todayDay &&
            data.server.month === todayMonth) {

            channel.send(`🎉 Happy Server Anniversary! 💜`);
        }

        bdayService.saveData(data);

    }, {
        timezone: "Europe/Berlin"
    });

}

module.exports = { startScheduler };