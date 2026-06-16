const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post an announcement message to a selected channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel where the announcement should be posted')
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.AnnouncementThread
        )
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('embed')
        .setDescription('Send the announcement as an embed')
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const useEmbed = interaction.options.getBoolean('embed') ?? false;

    if (!channel || !channel.isTextBased() || !channel.send) {
      return interaction.reply({
        content: '❌ Please choose a valid text-based channel.',
        flags: 64
      });
    }

    try {
      const modalCustomId = `announce_modal:${interaction.id}`;

      const modal = new ModalBuilder()
        .setCustomId(modalCustomId)
        .setTitle('Create Announcement');

      const titleInput = new TextInputBuilder()
        .setCustomId('announce_title')
        .setLabel('Title (optional, used for embed)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(256);

      const textInput = new TextInputBuilder()
        .setCustomId('announce_text')
        .setLabel('Announcement text')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(4000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(textInput)
      );

      await interaction.showModal(modal);

      const submitted = await interaction.awaitModalSubmit({
        filter: i => i.customId === modalCustomId && i.user.id === interaction.user.id,
        time: 5 * 60 * 1000
      });

      const title = submitted.fields.getTextInputValue('announce_title')?.trim();
      const text = submitted.fields.getTextInputValue('announce_text');

      if (useEmbed) {
        const embed = new EmbedBuilder()
          .setColor(0x9B59B6)
          .setDescription(text)
          .setTimestamp();

        if (title) {
          embed.setTitle(title);
        }

        await channel.send({ embeds: [embed] });
      } else {
        const content = title ? `**${title}**\n${text}` : text;
        await channel.send({ content });
      }

      return submitted.reply({
        content: `✅ Announcement sent to ${channel}${useEmbed ? ' as an embed' : ''}.`,
        flags: 64
      });
    } catch (error) {
      if (error?.name === 'Error [InteractionCollectorError]') {
        return;
      }

      console.error('Error in /announce:', error);
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({
          content: '❌ Could not send the announcement. Check my channel permissions.',
          flags: 64
        });
      }

      return interaction.reply({
        content: '❌ Could not send the announcement. Check my channel permissions.',
        flags: 64
      });
    }
  }
};
