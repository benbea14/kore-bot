const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setCustomTitle } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpcustomtitle')
    .setDescription('Set a custom title for a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('title').setDescription('Custom title').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user');
      const title = interaction.options.getString('title');

      const success = setCustomTitle(user.id, title);
      
      if (!success) {
        return await interaction.reply({
          content: '❌ Failed to set custom title. Invalid user.',
          flags: 64
        });
      }

      await interaction.reply(`✅ Custom title for ${user.username}: **${title}**`);
    } catch (error) {
      console.error('Error setting custom title:', error);
      await interaction.reply({
        content: '⚠️ Something went wrong while setting the custom title.',
        flags: 64
      });
    }
  }
};
