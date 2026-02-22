const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getLevelData } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your level'),

  async execute(interaction) {
    const user = interaction.user;
    const data = getUser(user.id);
    const levelInfo = getLevelData(data.level);

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`💜 ${user.username}'s Rank`)
      .addFields(
        { name: 'Level', value: `Lv ${data.level}`, inline: true },
        { name: 'XP', value: `${data.xp}`, inline: true },
        { name: 'Title', value: `${levelInfo.emoji} ${levelInfo.title}`, inline: false }
      )
    if (data.customTitle) {
      embed.addFields({ name: 'Custom Title', value: `💠 ${data.customTitle}`, inline: false });
    }

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
};
