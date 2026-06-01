const fs = require('node:fs');
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

function normalizeName(value) {
    return (value || '')
        .trim()
        .replace(/\s*\(left\)\s*$/i, '')
        .toLowerCase();
}

// ADD BIRTHDAY
function addBirthday({ type, userId = null, name = null, displayName = null, day, month, year = null }) {

    const data = loadData();

    const newEntry = {
        type,
        userId,
        name,
        displayName: type === 'user' ? displayName : null,
        day,
        month,
        year,
        recurring: true
    };

    data.birthdays.push(newEntry);
    saveData(data);

    return newEntry;
}

// REMOVE BIRTHDAY
function removeBirthday({ type, userId = null, name = null, displayName = null }) {
    const data = loadData();
    const before = data.birthdays.length;

    if (type === 'user' && userId) {
        data.birthdays = data.birthdays.filter(b => !(b.type === 'user' && b.userId === userId));
    } else if (type === 'name' && name) {
        if (name.trim().toLowerCase() === 'unknown') {
            data.birthdays = data.birthdays.filter(b => !(
                b.type === 'user' &&
                !b.name &&
                !b.displayName
            ));
        } else {
            const targetName = normalizeName(name);

            data.birthdays = data.birthdays.filter((b) => {
                if (b.type === 'name') {
                    return normalizeName(b.name) !== targetName;
                }

                if (b.type === 'user') {
                    return normalizeName(b.displayName) !== targetName;
                }

                return true;
            });
        }
    } else if (type === 'displayName' && displayName) {
        const targetDisplayName = normalizeName(displayName);

        data.birthdays = data.birthdays.filter(
            b => !(b.type === 'user' && normalizeName(b.displayName) === targetDisplayName && !b.name)
        );
    }

    saveData(data);
    return before !== data.birthdays.length;
}

// ADD EVENT
function addEvent({ name, day, month, year, recurring = false }) {

    const data = loadData();

    const newEvent = {
        name,
        day,
        month,
        year,
        recurring
    };

    data.events.push(newEvent);
    saveData(data);

    return newEvent;
}

// REMOVE EVENT
function removeEvent(name) {
    const data = loadData();
    const before = data.events.length;

    data.events = data.events.filter(e => e.name !== name);

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