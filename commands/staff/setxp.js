const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addXP, getLevelData } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpset')
    .setDescription('Add XP to a user (staff only)')
    .addUserOption(o => o.setName('user').setDescription('User to give XP').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('XP amount to add').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // nur Staff

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    const result = await addXP(user.id, amount, interaction.guild.members.cache.get(user.id)); // gibt Objekt mit level, leveledUp, title etc.

    if (result.excluded) {
      return interaction.reply({
        content: `🚫 <@${user.id}> is excluded from the XP system. Use /xpuser start first.`,
        flags: 64
      });
    }

    const levelInfo = getLevelData(result.level);

    let reply = `✅ Added **${amount} XP** to <@${user.id}>.\n`;
    if (result.leveledUp) {
      reply += `🎉 <@${user.id}> leveled up to **Lv${result.level}**!\nUnlocked: ${levelInfo.emoji} **${levelInfo.title}**`;
    }

    await interaction.reply({ content: reply });
  }
};
