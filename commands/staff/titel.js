const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setCustomTitle } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpcustomtitle')
    .setDescription('Manage custom titles for users')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Set a custom title for a user')
        .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
        .addStringOption(o => o.setName('title').setDescription('Custom title').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a custom title from a user')
        .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const user = interaction.options.getUser('user');

      if (subcommand === 'set') {
        const title = interaction.options.getString('title');
        const success = setCustomTitle(user.id, title);
        
        if (!success) {
          return await interaction.reply({
            content: '❌ Failed to set custom title. Invalid user.',
            flags: 64
          });
        }

        await interaction.reply(`✅ Custom title for ${user.username}: **${title}**`);
      } 
      else if (subcommand === 'remove') {
        const success = setCustomTitle(user.id, null);
        
        if (!success) {
          return await interaction.reply({
            content: '❌ Failed to remove custom title. Invalid user.',
            flags: 64
          });
        }

        await interaction.reply(`✅ Custom title removed for ${user.username}`);
      }
    } catch (error) {
      console.error('Error managing custom title:', error);
      await interaction.reply({
        content: '⚠️ Something went wrong while managing the custom title.',
        flags: 64
      });
    }
  }
};
