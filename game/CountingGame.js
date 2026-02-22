const { makeError, EmbedBuilder } = require("discord.js");

const COUNTING_CHANNEL_ID = process.env.COUNTING_CHANNEL_ID;

let currentNumber = 0;
let lastUserId = null;

async function countingGame(message) {
    if (message.auther.bot) return;
    if (message.channel.id !== COUNTING_CHANNEL_ID) return;

    const number = parseInt(message.content);
    if (isNaN(number)) return;

    if (message.auther.id === lastUserId) {
        await message.react("🚫")
        await message.reply("🚫 You can`t count twice in a row! Reset to 1.");
        currentNumber = 0;
        lastUserId = null;
        return;
    }

    if (number !== currentNumber + 1) {
        await message.react("❌")
        await message.reply(`❌ Wrong number! It was ${currentNumber + 1}. Reset to 1.'`);
        currentNumber = 0;
        lastUserId = null;
        return;
    }

    currentNumber++;
    lastUserId = message.author.id;

    await message.react("💜");

    // Milestones
    if (currentNumber === 25 || currentNumber === 50 || currentNumber === 75 || currentNumber === 100);

        const embed = new EmbedBuilder()
            .setColor("0x9B59B6")
            .setTitle("A Milestone!")
            .setDescription(`We just reached **${currentNumber}**! 💜'`)
            .setFooter({ text: "ARMY!! Keep counting!!"})
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
}

module.exports = countingGame;