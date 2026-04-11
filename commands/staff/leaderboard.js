const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllUsers } = require('../../XP/leveling');

const LEVEL_MULTIPLIER = 100; // XP pro Level (consistent with leveling.js)
const LEADERBOARD_LIMIT = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpleaderboard')
    .setDescription('Shows the top 10 XP leaderboard'),

  async execute(interaction) {
    try {
      const xpData = getAllUsers();
      const users = Object.entries(xpData);

      if (users.length === 0) {
        return interaction.reply({ content: 'No XP data found yet.', flags: 64 });
      }

        // Defer immediately — member fetching takes time and may exceed the 3s window
        await interaction.deferReply();

        // Sortieren nach Prestige -> Level -> XP
      users.sort((a, b) => {
        const prestigeDiff = (b[1].prestige || 0) - (a[1].prestige || 0);
        if (prestigeDiff !== 0) return prestigeDiff;

        if (b[1].level !== a[1].level) {
          return b[1].level - a[1].level;
        }

        return b[1].xp - a[1].xp;
      });

      const generateEmbed = async () => {
        const topUsers = users.slice(0, LEADERBOARD_LIMIT);
        const members = await Promise.all(
          topUsers.map(async ([userId, userData], index) => {
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            return { member, userData, rank: index + 1 };
          })
        );

        let description = '';
        for (const { member, userData, rank } of members) {
          if (!member) continue;

          const displayName = member.nickname || member.user.username;
          const prestigeText = userData.prestige ? ` | Prestige ${userData.prestige}` : '';
          description += `**${rank}. ${displayName}** — Level ${userData.level}${prestigeText} | ${userData.xp}/${userData.level * LEVEL_MULTIPLIER} XP\n`;
        }

        return new EmbedBuilder()
          .setColor(0x9B59B6)
          .setTitle('🏆 Top 10 Level-Ups')
          .setDescription(description || 'No valid members found.')
          .setTimestamp();
      };

      await interaction.editReply({ embeds: [await generateEmbed()] });

    } catch (error) {
      console.error('Leaderboard error:', error);
        if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Something went wrong while loading the leaderboard.', flags: 64 });
        } else if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: '⚠️ Something went wrong while loading the leaderboard.' });
      }
    }
  }
};