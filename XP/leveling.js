const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '..', 'data', 'xp.json');
let xpData = {};

try {
  xpData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (err) {
  console.error("XP Data corrupted, resetting...");
  xpData = {};
}

const COOLDOWN = 60 * 1000;
const XP_PER_MESSAGE = [10, 20];
const LEVEL_MULTIPLIER = 100;

const cooldowns = new Map();

function saveData() {
  fs.writeFile(dataPath, JSON.stringify(xpData, null, 2), (err) => {
    if (err) console.error("Save error:", err);
  });
}

function getRandomXP() {
  return Math.floor(Math.random() * (XP_PER_MESSAGE[1] - XP_PER_MESSAGE[0] + 1)) + XP_PER_MESSAGE[0];
}

// 🎖 TITEL SYSTEM
const TITLES = [
  { level: 1, title: "Borahae Newbie", emoji: "🌱" },
  { level: 4, title: "Rising ARMY Star", emoji: "✨" },
  { level: 8, title: "Bangtan Supporter", emoji: "🎤" },
  { level: 10, title: "Stage Dreamer", emoji: "🎶" },
  { level: 15, title: "Lightstick Holder", emoji: "🔦" },
  { level: 20, title: "Purple Blood Elite", emoji: "💜" },
  { level: 25, title: "Concert Screamer", emoji: "📣" },
  { level: 30, title: "ARMY Veteran", emoji: "🔥" },
  { level: 35, title: "Mic Drop Energy", emoji: "🎧" },
  { level: 40, title: "Bangtan Legend", emoji: "👑" },
  { level: 45, title: "Stage Commander", emoji: "⚡" },

  { level: 50, title: "Diamond ARMY", emoji: "💎🌟" },
  { level: 55, title: "Purple Aura", emoji: "🪄🌌" },
  { level: 60, title: "Whalien Guardian", emoji: "🐋🛡️" },
  { level: 65, title: "ARMY Icon", emoji: "🎖️⭐" },
  { level: 70, title: "Global Superstar", emoji: "🌍🚀" },
  { level: 75, title: "Stadium Voice", emoji: "🏟️📢" },
  { level: 80, title: "Eternal ARMY", emoji: "♾️🌠" },
  { level: 85, title: "Galaxy Voyager", emoji: "🛸🌙" },
  { level: 90, title: "Bangtan Immortal", emoji: "🕊️⚔️" },
  { level: 95, title: "Bangtan Myth", emoji: "🐉🔥" },

  { level: 100, title: "Borahae Supreme", emoji: "👑💜💫" }
];

// 🎖 PRESTIGE-TITEL SYSTEM
const PRESTIGE_TITLES = [
  { level: 1, title: "Borahae Return", emoji: "🌱" },
  { level: 4, title: "Rising ARMY Again", emoji: "✨" },
  { level: 8, title: "Bangtan Devotee", emoji: "🎤" },
  { level: 10, title: "Stage Believer", emoji: "🎶" },
  { level: 15, title: "Lightstick Master", emoji: "🔦" },
  { level: 20, title: "Purple Blood Master", emoji: "💜" },
  { level: 25, title: "Concert Screecher", emoji: "📣" },
  { level: 30, title: "ARMY Expert", emoji: "🔥" },
  { level: 35, title: "Mic Drop Vibe", emoji: "🎧" },
  { level: 40, title: "Bangtan Lore", emoji: "👑" },
  { level: 45, title: "Stage Leader", emoji: "⚡" },

  { level: 50, title: "Diamond ARMY", emoji: "💎🌟" },
  { level: 55, title: "Purple Aura", emoji: "🪄🌌" },
  { level: 60, title: "Whalien Guardian", emoji: "🐋🛡️" },
  { level: 65, title: "ARMY Icon", emoji: "🎖️⭐" },
  { level: 70, title: "Global Superstar", emoji: "🌍🚀" },
  { level: 75, title: "Stadium Voice", emoji: "🏟️📢" },
  { level: 80, title: "Eternal ARMY", emoji: "♾️🌠" },
  { level: 85, title: "Galaxy Voyager", emoji: "🛸🌙" },
  { level: 90, title: "Bangtan Immortal", emoji: "🕊️⚔️" },
  { level: 95, title: "Bangtan Saga", emoji: "🐉🔥" },

  { level: 100, title: "Borahae Supreme", emoji: "👑💜💫" }
];

function getLevelData(level, prestige = 0) {
  const list = prestige > 0 ? PRESTIGE_TITLES : TITLES;

  let current = list[0];
  for (const t of list) {
    if (level >= t.level) current = t;
  }
  return current;
}

async function updateNickname(member, level) {
  if (!member.manageable) return;

  const prestige = xpData[member.id]?.prestige || 0;
  const levelInfo = getLevelData(level, prestige);
  
  // Entfernt alte Emojis
  const baseName = member.displayName
  .replace(/^✦+\s*\|\s*/, '')
  .replace(/\s*\|\s*.*$/, '');

  

  const bigStars = Math.floor(prestige / 5);
  const smallStars = prestige % 5;

  const stars =
    "✪".repeat(bigStars) +
    "✦".repeat(smallStars);

  const newNick = `${stars ? stars + " | " : ""}${baseName} | ${levelInfo.emoji}`;

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

  // Optional: pro Server + Channel Cooldown
  const key = `${message.guild.id}-${message.channel.id}-${userId}`;

  if (cooldowns.has(key) && now - cooldowns.get(key) < COOLDOWN) return;
  cooldowns.set(key, now);

  if (!xpData[userId]) {
  xpData[userId] = { xp: 0, level: 1, prestige: 0, title: null };
  }

  const gainedXP = getRandomXP();
  xpData[userId].xp += gainedXP;

  let leveledUp = false;
  let currentLevel = xpData[userId].level;

  let prestigeUp = false;

  while (xpData[userId].xp >= currentLevel * LEVEL_MULTIPLIER) {
    xpData[userId].xp -= currentLevel * LEVEL_MULTIPLIER;
    currentLevel++;

    if (currentLevel > 100) {
      xpData[userId].prestige = (xpData[userId].prestige || 0) + 1;
      currentLevel = 1;
      prestigeUp = true;
    }

    xpData[userId].level = currentLevel;
    leveledUp = true;
  }

  saveData();

  if (leveledUp) {
    await updateNickname(message.member, currentLevel);
    
    const levelInfo = getLevelData(currentLevel, xpData[userId].prestige)

    return {
      userId,
      level: currentLevel,
      xp: xpData[userId].xp,
      leveledUp: true,
      prestigeUp,
      prestige: xpData[userId].prestige,
      emoji: levelInfo.emoji,
      title: xpData[userId].customTitle || levelInfo.title
    };
  }

  return null;
}

function getUser(userId) {
  if (!xpData[userId]) return { xp: 0, level: 1, prestige: 0, title: null, customTitle: null };
  return xpData[userId];
}

function setLevel(userId, level) {
  if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, prestige: 0, title: null };

  xpData[userId].level = level;
  xpData[userId].xp = 0;
  saveData();
}

function setCustomTitle(userId, customTitle) {
  if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, prestige: 0, title: null, customTitle: null };
  xpData[userId].customTitle = customTitle;
  saveData();
}

async function addXP(userId, amount, member = null) {
  if (!xpData[userId]) {
    xpData[userId] = { xp: 0, level: 1, prestige: 0, title: null };
  }

  xpData[userId].xp += amount;

  let leveledUp = false;
  let currentLevel = xpData[userId].level;
  let prestigeUp = false;

  while (xpData[userId].xp >= currentLevel * LEVEL_MULTIPLIER) {
    xpData[userId].xp -= currentLevel * LEVEL_MULTIPLIER;
    currentLevel++;

    if (currentLevel > 100) {
      xpData[userId].prestige = (xpData[userId].prestige || 0) + 1;
      currentLevel = 1;
      prestigeUp = true;
    }

    xpData[userId].level = currentLevel;
    leveledUp = true;
  }

  saveData();

  const levelInfo = getLevelData(currentLevel, xpData[userId].prestige);

  return {
    userId,
    level: currentLevel,
    xp: xpData[userId].xp,
    leveledUp,
    prestigeUp,
    prestige: xpData[userId].prestige,
    emoji: levelInfo.emoji,
    title: xpData[userId].customTitle || levelInfo.title
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