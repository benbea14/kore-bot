const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bias')
    .setDescription('Choose your BTS bias and receive a role.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // <-- nur Staff

  async execute(interaction) {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('role_rm').setLabel('RM 🐨').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('role_jin').setLabel('Jin 🐹').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('role_suga').setLabel('SUGA 🐱').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('role_jhope').setLabel('j-hope 🐿').setStyle(ButtonStyle.Primary),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('role_jimin').setLabel('Jimin 🐥').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('role_v').setLabel('V 🐻').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('role_jk').setLabel('JK 🐰').setStyle(ButtonStyle.Primary),
    );

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('💜 Choose Your Bias')
      .setDescription(
        'Click a button to receive your BTS bias role.\n' +
        'You can switch anytime by pressing another button.'
      )
      .setFooter({ text: 'Purple Hours' });

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
    });
  }
};

