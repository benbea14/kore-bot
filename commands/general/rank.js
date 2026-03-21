const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getLevelData } = require('../../XP/leveling');

const LEVEL_MULTIPLIER = 100;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your level'),

  async execute(interaction) {
    try {
      const user = interaction.user;
      const member = interaction.member;
      const data = getUser(user.id);
      const levelInfo = getLevelData(data.level);

      const nextLevelXP = data.level * LEVEL_MULTIPLIER;
      const xpNeeded = nextLevelXP - data.xp;

      // Fortschrittsbalken
      const totalBars = 20;
      const progressRatio = data.xp / nextLevelXP;
      const filledBars = Math.floor(progressRatio * totalBars);
      const emptyBars = totalBars - filledBars;
      const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(emptyBars);

      const displayName =
        interaction.guild && member?.nickname
          ? member.nickname
          : user.username;

      const fields = [
        { name: 'Level', value: `Lv **${data.level}**`, inline: true },

        // 👇 Grundtitel bleibt IMMER
        { name: 'Title', value: `${levelInfo.emoji} **${levelInfo.title}**`, inline: true },
      ];

      // 👇 Custom Title ist ZUSATZ
      if (data.customTitle) {
        fields.push({
          name: 'Special Title',
          value: `**${data.customTitle}**`,
          inline: true
        });
      }

      fields.push(
        {
          name: 'Progress',
          value: `${data.xp}/${nextLevelXP} XP (${xpNeeded} XP until next level)\n${progressBar}`,
          inline: false
        },
        { name: '\u200b', value: '✨ Fighting! 💜', inline: false }
      );

      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(`💜 ${displayName}'s Rank`)
        .addFields(fields)
        .setFooter({ text: 'Auto XP System • Chat to grow' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error('Error in /rank:', error);

      if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ Something went wrong while fetching your rank.',
          flags: 64
        });
      }
    }
  }
};
