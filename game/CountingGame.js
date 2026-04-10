const fs = require('node:fs');
const { EmbedBuilder } = require("discord.js");
const COUNTING_CHANNEL_ID = process.env.COUNTING_CHANNEL_ID;

const countFilePath = '/data/count.json';

let countData = {};

function getDefaultState() {
  return {
    currentNumber: 0,
    lastUserId: null,
  };
}

function saveCountData() {
  fs.writeFileSync(countFilePath, JSON.stringify(countData, null, 2));
}

function getState(channelId) {
  if (!countData[channelId]) {
    countData[channelId] = getDefaultState();
  }

  return countData[channelId];
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(countFilePath)) {
  fs.writeFileSync(countFilePath, '{}');
}

// Load count data on startup
try {
  countData = JSON.parse(fs.readFileSync(countFilePath, 'utf8'));
} catch (err) {
  console.error("Count data corrupted, resetting...", err);
  countData = {};
  saveCountData();
}

async function countingGame(message) {
    if (message.author.bot) return;
    if (message.channel.id !== COUNTING_CHANNEL_ID) return;

    const state = getState(message.channel.id);

    const number = parseInt(message.content);
    if (isNaN(number)) return;

    if (message.author.id === state.lastUserId) {
        await message.react("🚫");
        await message.reply("🚫 You can’t count twice in a row! Reset to 1.");
        state.currentNumber = 0;
        state.lastUserId = null;
        saveCountData();
        return;
    }

    if (number !== state.currentNumber + 1) {
        await message.react("❌");
        await message.reply(`❌ Wrong number! It was ${state.currentNumber + 1}. Reset to 1.`);
        state.currentNumber = 0;
        state.lastUserId = null;
        saveCountData();
        return;
    }

    state.currentNumber++;
    state.lastUserId = message.author.id;
    saveCountData();

    await message.react("💜");

    // Milestones
    if (state.currentNumber % 25 === 0 && state.currentNumber <= 1000
    ) {
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle("🎉 A Milestone!")
            .setDescription(`We just reached **${state.currentNumber}**! 💜`)
            .setFooter({ text: "ARMY!! Keep counting!!" })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
    }
}

module.exports = countingGame;