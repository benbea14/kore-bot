const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('biasstats')
    .setDescription('Shows BTS bias role statistics.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Staff only

  async execute(interaction) {

    const biasRoles = [
      { name: '🐨 RM', label: '🐨 RM' },
      { name: '🐹 Jin', label: '🐹 Jin' },
      { name: '🐱 Suga', label: '🐱 SUGA' },
      { name: '🐿 J-Hope', label: '🐿 J-Hope' },
      { name: '🐥 Jimin', label: '🐥 Jimin' },
      { name: '🐻 V', label: '🐻 V' },
      { name: '🐰 JK', label: '🐰 JK' }
    ];

    let description = '';
    let total = 0;

    // Erst Gesamtzahl berechnen
    for (const bias of biasRoles) {
      const role = interaction.guild.roles.cache.find(r => r.name === bias.name);
      if (role) {
        total += role.members.size;
      }
    }

    // Dann einzelne Werte + Prozent
    for (const bias of biasRoles) {
      const role = interaction.guild.roles.cache.find(r => r.name === bias.name);

      if (!role) {
        description += `${bias.label} — Role not found\n`;
        continue;
      }

      const count = role.members.size;
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

      description += `${bias.label} — **${count}** (${percent}%)\n`;
    }

    const today = new Date().toLocaleDateString('de-DE');

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('💜 BTS Bias Statistics')
      .setDescription(description)
      .addFields({
        name: 'Total Participants',
        value: `**${total}**`,
        inline: false
      })
      .setFooter({ text: `Stand: ${today}` });

    await interaction.reply({
      embeds: [embed],
      flags: 64,
    });
  }
};
