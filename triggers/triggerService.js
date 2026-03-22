const fs = require('fs');

const triggerPath = '/data/trigger.json';

// Initialize data file if it doesn't exist
if (!fs.existsSync(triggerPath)) {
    const initialData = {
        enabled: false,
        triggers: []
    };

    fs.writeFileSync(triggerPath, JSON.stringify(initialData, null, 2));
}

// Load triggers
function loadTriggers() {
    try {
        const data = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
        return {
            enabled: data.enabled ?? false,
            triggers: data.triggers ?? []
        };
    } catch (err) {
        console.error("Trigger data corrupted:", err);
        return { enabled: false, triggers: [] };
    }
}

// Save triggers
function saveTriggers(data) {
    try {
        fs.writeFileSync(triggerPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error saving triggers:", err);
    }
}

// Find matching triggers for a message
function findMatchingTrigger(messageContent) {
    if (!messageContent) return [];
    
    const data = loadTriggers();
    if (!data.triggers) return [];
    
    const content = messageContent.toLowerCase();

    return data.triggers.filter(trigger =>
        trigger.keywords?.some(k => content.includes(k.toLowerCase()))
    );
}

module.exports = {
    loadTriggers,
    saveTriggers,
    findMatchingTrigger
};