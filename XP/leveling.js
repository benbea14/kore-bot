const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
let xpData = {};

if (fs.existsSync(dataPath)) {
  xpData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

const COOLDOWN = 60 * 1000;
const XP_PER_MESSAGE = [10, 20];
const LEVEL_MULTIPLIER = 100;

const cooldowns = new Map();

function saveData() {
  fs.writeFileSync(dataPath, JSON.stringify(xpData, null, 2));
}

function getRandomXP() {
  return Math.floor(Math.random() * (XP_PER_MESSAGE[1] - XP_PER_MESSAGE[0] + 1)) + XP_PER_MESSAGE[0];
}

// 🎖 TITEL SYSTEM
const TITLES = [
  { level: 1, title: "Borahae Newbie", emoji: "🌱" },
  { level: 5, title: "Rising ARMY Star", emoji: "✨" },
  { level: 10, title: "Bangtan supporter ", emoji: "🎤" },
  { level: 20, title: "Purple blood elite", emoji: "💜" },
  { level: 30, title: "ARMY Veteran", emoji: "🔥" },
  { level: 40, title: "Bangtan Legend", emoji: "👑" },
];

function getLevelData(level) {
  let current = TITLES[0];
  for (const t of TITLES) {
    if (level >= t.level) current = t;
  }
  return current;
}

async function updateNickname(member, level) {
  if (!member.manageable) return;

  const levelInfo = getLevelData(level);
  const baseName = message.member.displayName;

  const newNick = `${baseName} ${levelInfo.emoji}`;

  try {
    await member.setNickname(newNick);
  } catch (error) {
    console.log(`Couldn't set nickname for ${member.user.tag}: ${error}`);
  }
}

// 🎯 MESSAGE HANDLER
async function handleMessage(message) {
  if (!message.guild) return;
  if (message.author.bot) return;

  const userId = message.author.id;

  const now = Date.now();
  if (cooldowns.has(userId) && now - cooldowns.get(userId) < COOLDOWN) return;
  cooldowns.set(userId, now);

  if (!xpData[userId]) {
    xpData[userId] = { xp: 0, level: 1, title: null };
  }

  const gainedXP = getRandomXP();
  xpData[userId].xp += gainedXP;

  let leveledUp = false;
  let currentLevel = xpData[userId].level;

  while (xpData[userId].xp >= currentLevel * LEVEL_MULTIPLIER) {
    xpData[userId].xp -= currentLevel * LEVEL_MULTIPLIER;
    currentLevel++;
    xpData[userId].level = currentLevel;
    leveledUp = true;
  }

  saveData();

  if (leveledUp) {
    const levelInfo = getLevelData(currentLevel);

    await updateNickname(message.member, currentLevel);

    return {
      userId,
      level: currentLevel,
      emoji: levelInfo.emoji,
      title: xpData[userId].title || levelInfo.title,
      leveledUp: true
    };
  }

  return null;
}

function getUser(userId) {
  if (!xpData[userId]) return { xp: 0, level: 1, title: null, customTitle: null };
  return xpData[userId];
}

function setLevel(userId, level) {
  if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, title: null };

  xpData[userId].level = level;
  xpData[userId].xp = 0;
  saveData();
}

function setCustomTitle(userId, customTitle) {
  if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, title: null, customTitle: null };
  xpData[userId].customTitle = customTitle;
  saveData();
}

async function addXP(userId, amount, member = null) {

  if (!xpData[userId]) {
    xpData[userId] = { xp: 0, level: 1, title: null };
  }

  xpData[userId].xp += amount;

  let leveledUp = false;
  let currentLevel = xpData[userId].level;

  while (xpData[userId].xp >= currentLevel * LEVEL_MULTIPLIER) {
    xpData[userId].xp -= currentLevel * LEVEL_MULTIPLIER;
    currentLevel++;
    xpData[userId].level = currentLevel;
    leveledUp = true;
  }

  saveData();

  if (leveledUp && member) {
    await updateNickname(member, currentLevel);
  }

  const levelInfo = getLevelData(currentLevel);

  return {
    level: currentLevel,
    leveledUp,
    title: xpData[userId].title || levelInfo.title
  };
}

module.exports = {
  handleMessage,
  getUser,
  setLevel,
  setCustomTitle,
  getLevelData,
  updateNickname,
  addXP

};

