const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllUsers } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpaudit')
    .setDescription('Show XP data audit counts (Owner only)'),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.USER_ID) {
        return interaction.reply({
          content: 'Only for the Bot Owner.',
          flags: 64
        });
      }

      await interaction.deferReply({ flags: 64 });

      const allUsers = getAllUsers();
      const xpUserIds = Object.keys(allUsers);
      const totalXPUsers = xpUserIds.length;

      const members = await interaction.guild.members.fetch();

      let activeMembersWithXP = 0;
      let excludedUsers = 0;

      for (const userId of xpUserIds) {
        if (members.has(userId)) {
          activeMembersWithXP += 1;
        }

        if (allUsers[userId]?.excluded === true) {
          excludedUsers += 1;
        }
      }

      const leftMembersWithXP = totalXPUsers - activeMembersWithXP;

      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('XP Data Audit')
        .addFields(
          { name: 'Total XP records', value: `${totalXPUsers}`, inline: true },
          { name: 'Current members with XP', value: `${activeMembersWithXP}`, inline: true },
          { name: 'Left members still in XP', value: `${leftMembersWithXP}`, inline: true },
          { name: 'Excluded from XP', value: `${excludedUsers}`, inline: true }
        )
        .setFooter({ text: 'Counts only, no user data dump' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in /xpaudit:', error);

      if (interaction.deferred) {
        return interaction.editReply({
          content: '⚠️ Could not run XP audit.'
        });
      }

      return interaction.reply({
        content: '⚠️ Could not run XP audit.',
        flags: 64
      });
    }
  }
};
