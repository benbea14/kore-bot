const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = '/data/xp.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpreset')
    .setDescription('Resets ALL XP data (Creator only)'),

  async execute(interaction) {
    try {
      // Creator Only
      if (interaction.user.id !== process.env.USER_ID) {
        return interaction.reply({ 
          content: 'Only for the Bot Owner.', 
          flags: 64 
        });
      }

      await interaction.reply({ 
        content: '⚠️ Reset running... please wait.', 
        flags: 64 
      });

      try {
        // Delete all XP data
        fs.writeFileSync(path, JSON.stringify({}, null, 2));
      } catch (err) {
        console.error("Reset Error:", err);
        throw err;
      }

      // Fetch all members in guild
      const guild = interaction.guild;
      await guild.members.fetch();

      // Clean up nicknames for all members (non-async)
      const members = guild.members.cache.filter(m => !m.user.bot);
      let processedCount = 0;
      let failedCount = 0;

      for (const member of members.values()) {
        try {
          const cleanName = member.displayName
            .replace(/^✦+\s*\|\s*/, '')
            .replace(/\s*\|\s*.*$/, '')
            .trim();

          if (member.manageable) {
            await member.setNickname(cleanName);
            processedCount++;
          }
        } catch (err) {
          console.warn(`Couldn't reset nickname for ${member.user.tag}:`, err.message);
          failedCount++;
        }
      }

      await interaction.editReply(`✅ XP was completely reset!\n📊 ${processedCount} Nicknames updated${failedCount > 0 ? `, ${failedCount} failed` : ''}`);
    } catch (error) {
      console.error('Error in /xpreset:', error);
      
      if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ Error while resetting XP.',
          flags: 64
        });
      } else {
        await interaction.editReply('⚠️ Error while resetting XP.');
      }
    }
  }
};