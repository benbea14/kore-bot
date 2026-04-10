const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getAllUsers } = require('../../XP/leveling');

const LEVEL_MULTIPLIER = 100; // XP pro Level (consistent with leveling.js)
const USERS_PER_PAGE = 20;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpleaderboard')
    .setDescription('Shows the XP leaderboard with paging'),

  async execute(interaction) {
    try {
      const xpData = getAllUsers();
      const users = Object.entries(xpData);

      if (users.length === 0) {
        return interaction.reply({ content: 'No XP data found yet.', flags: 64 });
      }

      // Sortieren nach Level, dann XP
      users.sort((a, b) => {
        if (b[1].level === a[1].level) return b[1].xp - a[1].xp;
        return b[1].level - a[1].level;
      });

      // Paginierung
      const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
      let currentPage = 0;

      const generateEmbed = async (page) => {
        const start = page * USERS_PER_PAGE;
        const end = start + USERS_PER_PAGE;
        const pageUsers = users.slice(start, end);

        let description = '';
        for (let i = 0; i < pageUsers.length; i++) {
          const [userId, userData] = pageUsers[i];
          const member = await interaction.guild.members.fetch(userId).catch(() => null);
          if (!member) continue;

          const displayName = member.nickname || member.user.username;
          description += `**${start + i + 1}. ${displayName}** — Level ${userData.level} | ${userData.xp}/${userData.level * LEVEL_MULTIPLIER} XP\n`;
        }

        return new EmbedBuilder()
          .setColor(0x9B59B6)
          .setTitle('🏆 Server Leaderboard')
          .setDescription(description || 'No valid members found.')
          .setFooter({ text: `Page ${page + 1}/${totalPages}` })
          .setTimestamp();
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('⬅️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('➡️')
          .setStyle(ButtonStyle.Primary)
      );

      const message = await interaction.reply({ embeds: [await generateEmbed(currentPage)], components: [row], fetchReply: true });

      const collector = message.createMessageComponentCollector();

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: "You can't control this leaderboard.", flags: 64 });

        if (i.customId === 'next') {
          currentPage = (currentPage + 1) % totalPages;
        } else if (i.customId === 'prev') {
          currentPage = (currentPage - 1 + totalPages) % totalPages;
        }

        await i.update({ embeds: [await generateEmbed(currentPage)], components: [row] });
      });

    } catch (error) {
      console.error('Leaderboard error:', error);
      if (!interaction.replied) {
        await interaction.reply({ content: '⚠️ Something went wrong while loading the leaderboard.', flags: 64 });
      }
    }
  }
};