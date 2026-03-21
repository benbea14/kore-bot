const fs = require('fs');
const path = require('path');
const triggerPath = path.join(__dirname, '..', 'data', 'trigger.json');

function loadTriggers() {
    if (!fs.existsSync(triggerPath)) return { triggers: [] };
    return JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
}

function saveTriggers(data) {
    fs.writeFileSync(triggerPath, JSON.stringify(data, null, 2));
}

function findMatchingTrigger(messageContent) {
    const triggers = loadTriggers().triggers;
    const content = messageContent.toLowerCase();

    return triggers.filter(trigger =>
        trigger.keywords.some(k => content.includes(k))
    );
}

module.exports = {
    loadTriggers,
    saveTriggers,
    findMatchingTrigger
};