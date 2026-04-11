const fs = require('fs');
const path = '/data/xp.json'; // Railway Volume path

let xpData = {};
let xpPaused = false;

// Initialize data file if it doesn't exist
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, '{}');
}

// Load data on startup
try {
  xpData = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (err) {
  console.error("XP data corrupted, resetting...", err);
  xpData = {};
}

// Settings
const COOLDOWN = 60 * 1000;
const XP_PER_MESSAGE = [10, 20];
const LEVEL_MULTIPLIER = 100;

const cooldowns = new Map();

function setXPPaused(state) {
  xpPaused = state;
}

// Save data
function saveData() {
  try {
    fs.writeFileSync(path, JSON.stringify(xpData, null, 2));
  } catch (err) {
    console.error("Save error:", err);
  }
}

function reloadXPDataFromDisk() {
  try {
    xpData = JSON.parse(fs.readFileSync(path, 'utf8'));
    return true;
  } catch (err) {
    console.error("Reload error:", err);
    return false;
  }
}

// Generate random XP between min and max
function getRandomXP() {
  return Math.floor(Math.random() * (XP_PER_MESSAGE[1] - XP_PER_MESSAGE[0] + 1)) + XP_PER_MESSAGE[0];
}

// Title system
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

// Prestige title system
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

// Get title based on level and prestige
function getLevelData(level, prestige = 0) {
  if (!level || level < 0) return TITLES[0];
  const list = prestige > 0 ? PRESTIGE_TITLES : TITLES;
  let current = list[0];
  
  for (const t of list) {
    if (level >= t.level) current = t;
  }
  return current;
}

// Update member nickname with prestige stars and level emoji
async function updateNickname(member, level) {
  if (!member || !member.manageable) return;

  try {
    const prestige = xpData[member.id]?.prestige || 0;
    const levelInfo = getLevelData(level, prestige);
    
    // Keep only the original name part and ignore any old title/custom suffixes.
    const withoutPrestigePrefix = member.displayName
      .replace(/^[✪✦]+\s*\|\s*/, '')
      .trim();
    const baseName = withoutPrestigePrefix.split('|')[0].trim();

    const bigStars = Math.floor(prestige / 5);
    const smallStars = prestige % 5;
    const stars = "✪".repeat(bigStars) + "✦".repeat(smallStars);
    const newNick = `${stars ? stars + " | " : ""}${baseName} | ${levelInfo.emoji}`;

    await member.setNickname(newNick);
  } catch (error) {
    console.warn(`Couldn't set nickname for ${member.user?.tag || 'unknown'}: ${error.message}`);
  }
}

// Handle message XP gain
async function handleMessage(message) {
  if (xpPaused || !message.guild || message.author?.bot) return;

  try {
    const userId = message.author.id;
    const now = Date.now();
    const key = `${message.guild.id}-${message.channel.id}-${userId}`;

    if (cooldowns.has(key) && now - cooldowns.get(key) < COOLDOWN) return;
    cooldowns.set(key, now);

    if (!xpData[userId]) {
      xpData[userId] = { xp: 0, level: 1, prestige: 0, title: null, customTitle: null };
    }

    const gainedXP = getRandomXP();
    xpData[userId].xp += gainedXP;

    let leveledUp = false;
    let currentLevel = xpData[userId].level || 1;
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
      if (message.member) {
        await updateNickname(message.member, currentLevel);
      }
      
      const levelInfo = getLevelData(currentLevel, xpData[userId].prestige);

      return {
        userId,
        level: currentLevel,
        xp: xpData[userId].xp,
        leveledUp: true,
        prestigeUp,
        prestige: xpData[userId].prestige,
        emoji: levelInfo.emoji,
        title: levelInfo.title,
        customTitle: xpData[userId].customTitle
      };
    }

    return null;
  } catch (error) {
    console.error("Error handling message XP:", error);
    return null;
  }
}

// Get user XP data
function getUser(userId) {
  if (!userId) return null;
  if (!xpData[userId]) return { xp: 0, level: 1, prestige: 0, title: null,customTitle: null };
  return xpData[userId];
}

// Set user level
function setLevel(userId, level) {
  if (!userId || level < 1) return false;
  if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, prestige: 0, title: null,customTitle: null };
  xpData[userId].level = Math.max(1, Math.floor(level));
  xpData[userId].xp = 0;
  saveData();
  return true;
}

// Set custom title
function setCustomTitle(userId, customTitle) {
  if (!userId) return false;
  if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, prestige: 0, title: null, customTitle: null };
  xpData[userId].customTitle = customTitle || null;
  saveData();
  return true;
}

// Add XP to user
async function addXP(userId, amount, member = null) {
  if (!userId || !amount || amount < 0) return { leveledUp: false };
  
  if (!xpData[userId]) {
    xpData[userId] = { xp: 0, level: 1, prestige: 0, title: null, customTitle: null };
  }

  xpData[userId].xp += Math.floor(amount);

  let leveledUp = false;
  let currentLevel = xpData[userId].level || 1;
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
    if (member) {
      await updateNickname(member, currentLevel);
    }

    return { leveledUp: true, level: currentLevel, prestigeUp };
  }

  return { leveledUp: false };
}

// Reset user
function resetUser(userId) {
  if (!userId) return false;
  delete xpData[userId];
  saveData();
  return true;
}

// Get all users
function getAllUsers() {
  return { ...xpData };
}

// Export functions
module.exports = {
  handleMessage,
  updateNickname,
  getLevelData,
  getUser,
  setLevel,
  setCustomTitle,
  addXP,
  resetUser,
  getAllUsers,
  setXPPaused,
  reloadXPDataFromDisk
};