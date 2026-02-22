const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getLevelData } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your level'),

  async execute(interaction) {
    try {
      // Userdaten abrufen (async, falls getUser async ist)
      const data = await getUser(interaction.user.id);
      const levelInfo = getLevelData(data.level);

      // Embed bauen
      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(`💜 ${interaction.member.displayName}'s Rank`)
        .addFields(
          { name: 'Level', value: `Lv ${data.level}`, inline: true },
          { name: 'XP', value: `${data.xp}`, inline: true },
          { name: 'Title', value: `${levelInfo.emoji} ${data.customTitle || levelInfo.title}`, inline: false }
        )
        .setTimestamp();

      // Optional: wenn Custom Title vorhanden, extra Feld
      if (data.customTitle) {
        embed.addFields({ name: 'Custom Title', value: `💠 ${data.customTitle}`, inline: false });
      }

      // Reply senden
      await interaction.reply({ embeds: [embed], flags: 64 });
      
    } catch (error) {
      console.error('Error in /rank:', error);
      // Fehler Reply
      if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ Something went wrong while fetching your rank.',
          flags: 64;
        });
      }
    }
  }
};
