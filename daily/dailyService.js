// features/daily/dailyService.js

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'daily.json');

function loadData() {
    if (!fs.existsSync(dataPath)) {
        return {
            enabled: false,
            channel_id: null,
            slots: [],
            messages: []
        };
    }

    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
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