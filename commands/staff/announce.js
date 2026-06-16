const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

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
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('Announcement text (supports spaces)')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('embed')
        .setDescription('Send the announcement as an embed')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Optional embed title (only used when embed is true)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const text = interaction.options.getString('text', true);
    const useEmbed = interaction.options.getBoolean('embed') ?? false;
    const title = interaction.options.getString('title');

    if (!channel || !channel.isTextBased() || !channel.send) {
      return interaction.reply({
        content: '❌ Please choose a valid text-based channel.',
        flags: 64
      });
    }

    try {
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
        await channel.send({ content: text });
      }

      return interaction.reply({
        content: `✅ Announcement sent to ${channel}${useEmbed ? ' as an embed' : ''}.`,
        flags: 64
      });
    } catch (error) {
      console.error('Error in /announce:', error);
      return interaction.reply({
        content: '❌ Could not send the announcement. Check my channel permissions.',
        flags: 64
      });
    }
  }
};
