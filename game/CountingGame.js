const { EmbedBuilder } = require("discord.js");

const COUNTING_CHANNEL_ID = process.env.COUNTING_CHANNEL_ID;

let currentNumber = 0;
let lastUserId = null;

async function countingGame(message) {
    if (message.author.bot) return;
    if (message.channel.id !== COUNTING_CHANNEL_ID) return;

    const number = parseInt(message.content);
    if (isNaN(number)) return;

    if (message.author.id === lastUserId) {
        await message.react("🚫");
        await message.reply("🚫 You can’t count twice in a row! Reset to 1.");
        currentNumber = 0;
        lastUserId = null;
        return;
    }

    if (number !== currentNumber + 1) {
        await message.react("❌");
        await message.reply(`❌ Wrong number! It was ${currentNumber + 1}. Reset to 1.`);
        currentNumber = 0;
        lastUserId = null;
        return;
    }

    currentNumber++;
    lastUserId = message.author.id;

    await message.react("💜");

    // Milestones
    if (
        currentNumber === 25 ||
        currentNumber === 50 ||
        currentNumber === 75 ||
        currentNumber === 100 ||

        currentNumber === 125 ||
        currentNumber === 150 ||
        currentNumber === 175 ||
        currentNumber === 200 ||

        currentNumber === 225 ||
        currentNumber === 250 ||
        currentNumber === 275 ||
        currentNumber === 300 ||

        currentNumber === 325 ||
        currentNumber === 350 ||
        currentNumber === 375 ||
        currentNumber === 400 ||

        currentNumber === 425 ||
        currentNumber === 450 ||
        currentNumber === 475 ||
        currentNumber === 500 ||

        currentNumber === 525 ||
        currentNumber === 550 ||
        currentNumber === 575 ||
        currentNumber === 600 ||

        currentNumber === 625 ||
        currentNumber === 650 ||
        currentNumber === 675 ||
        currentNumber === 700 ||

        currentNumber === 725 ||
        currentNumber === 750 ||
        currentNumber === 775 ||
        currentNumber === 800 ||

        currentNumber === 825 ||
        currentNumber === 850 ||
        currentNumber === 875 ||
        currentNumber === 900 ||
        
        currentNumber === 925 ||
        currentNumber === 950 ||
        currentNumber === 975 ||
        currentNumber === 1000
    ) {
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle("🎉 A Milestone!")
            .setDescription(`We just reached **${currentNumber}**! 💜`)
            .setFooter({ text: "ARMY!! Keep counting!!" })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
    }
}

module.exports = countingGame;