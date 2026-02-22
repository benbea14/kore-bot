const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setCustomTitle } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('title')
    .setDescription('Set a custom title for a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('title').setDescription('Custom title').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const title = interaction.options.getString('title');

    setCustomTitle(user.id, title);

    await interaction.reply(`✅ Custom title for ${user.username}: **${title}**`);
  }
};
