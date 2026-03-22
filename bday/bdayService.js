const fs = require('fs');
const crypto = require('crypto');

const dataPath = '/data/bday.json';

// Datei erstellen, falls sie nicht existiert
if (!fs.existsSync(dataPath)) {
    const initialData = {
        meta: { version: 1 },
        birthdays: [],
        events: [],
        server: null,
        messages: {},
        settings: {}
    };
    
        fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
    }

// LOAD & SAVE
function loadData() {
    if (!fs.existsSync(dataPath)) {
        return {
            meta: { version: 1 },
            birthdays: [],
            events: [],
            server: null,
            messages: {},
            settings: {}
        };
    }

    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// ID GENERATOR
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

// ADD BIRTHDAY
function addBirthday({ type, userId = null, name = null, day, month, year = null }) {

    const data = loadData();

    const newEntry = {
        id: generateId("bd"),
        type,
        userId,
        name,
        day,
        month,
        year,
        recurring: true,
        images: []
    };

    data.birthdays.push(newEntry);
    saveData(data);

    return newEntry;
}

// REMOVE BIRTHDAY
function removeBirthday(id) {
    const data = loadData();

    const before = data.birthdays.length;

    data.birthdays = data.birthdays.filter(b => b.id !== id);

    saveData(data);

    return before !== data.birthdays.length;
}

// ADD EVENT
function addEvent({ name, day, month, year, recurring = false }) {

    const data = loadData();

    const newEvent = {
        id: generateId("ev"),
        name,
        day,
        month,
        year,
        recurring,
        images: []
    };

    data.events.push(newEvent);
    saveData(data);

    return newEvent;
}

// REMOVE EVENT
function removeEvent(id) {
    const data = loadData();

    const before = data.events.length;

    data.events = data.events.filter(e => e.id !== id);

    saveData(data);

    return before !== data.events.length;
}

// GET SORTED LISTS
function sortByDate(entries) {
    return entries.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
    });
}

function getBirthdays() {
    const data = loadData();
    return sortByDate([...data.birthdays]);
}

function getEvents() {
    const data = loadData();
    return sortByDate([...data.events]);
}

// AGE CALCULATION
function calculateAge(entry) {
    if (!entry.year) return null;

    const today = new Date();
    return today.getFullYear() - entry.year;
}

// EXPORTS
module.exports = {
    addBirthday,
    removeBirthday,
    addEvent,
    removeEvent,
    getBirthdays,
    getEvents,
    calculateAge,
    loadData,
    saveData
};