const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setLevel, updateNickname } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlevel')
    .setDescription('Set a user level')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addUserOption(o =>
      o.setName('user')
       .setDescription('User to modify')
       .setRequired(true)
    )

    .addIntegerOption(o =>
      o.setName('level')
       .setDescription('Level to set')
       .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const level = interaction.options.getInteger('level');

    setLevel(user.id, level);

    const member = await interaction.guild.members.fetch(user.id);
    await updateNickname(member, level);

    await interaction.reply({
      content: `Set ${user.username} to Lv${level}`,
    });
  }
};
