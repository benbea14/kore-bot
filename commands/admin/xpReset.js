const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = '/data/xp.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpreset')
    .setDescription('Resets ALL XP data (Creator only)'),

  async execute(interaction) {

    // 🔒 Owner Check
    if (interaction.user.id !== process.env.USER_ID) {
      return interaction.reply({ 
        content: 'Nur für den Bot Owner.', 
        flags: 64 
      });
    }

    await interaction.reply({ 
      content: '⚠️ Reset läuft... bitte warten.', 
      flags: 64 
    });

    let xpData = {};

    try {
      // 💾 XP komplett löschen
      fs.writeFileSync(path, JSON.stringify({}, null, 2));
    } catch (err) {
      console.error("Reset Error:", err);
    }

    // 🔄 Alle Member im Server durchgehen
    const guild = interaction.guild;
    await guild.members.fetch();

    guild.members.cache.forEach(async (member) => {
      if (member.user.bot) return;

      try {
        // ✂️ Nickname säubern
        const cleanName = member.displayName
          .replace(/^✦+\s*\|\s*/, '')
          .replace(/\s*\|\s*.*$/, '');

        if (member.manageable) {
          await member.setNickname(cleanName);
        }

      } catch (err) {
        console.log(`Couldn't reset nickname for ${member.user.tag}`);
      }
    });

    await interaction.editReply('✅ XP wurde komplett zurückgesetzt!');
  }
};