// features/daily/dailyService.js

const fs = require('fs');
const dataPath = '/data/daily.json';

// 📁 Datei erstellen, falls sie nicht existiert
if (!fs.existsSync(dataPath)) {
    const initialData = {
        enabled: false,
        channel_id: null,
        slots: [],
        messages: []
    };

    fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
}

function loadData() {
    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
        console.error("Daily data corrupted or missing:", err);
        return {
            enabled: false,
            channel_id: null,
            slots: [],
            messages: []
        };
    }
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function addMessage(message) {
    const data = loadData();
    data.messages.push(message);
    saveData(data);
}

function removeMessage(index) {
    const data = loadData();
    if (index < 0 || index >= data.messages.length) return false;

    data.messages.splice(index, 1);
    saveData(data);
    return true;
}

function getRandomMessageByCategory(category) {
    const data = loadData();
    const filtered = data.messages.filter(m => m.category === category);

    // Fallback auf random, falls Kategorie leer
    if (!filtered.length) {
        return data.messages.length ? data.messages[Math.floor(Math.random()*data.messages.length)] : null;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
}

module.exports = {
    loadData,
    saveData,
    addMessage,
    removeMessage,
    getRandomMessageByCategory
};