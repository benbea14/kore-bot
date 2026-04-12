const { SlashCommandBuilder, ChannelType } = require('discord.js');

const MAX_BULK_DELETE_AGE = 14 * 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chatclear')
    .setDescription('Deletes all messages in a channel (Creator only)')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to clear. Defaults to the current channel.')
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.AnnouncementThread
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.USER_ID) {
        return interaction.reply({
          content: 'Only for the Bot Owner.',
          flags: 64
        });
      }

      const channel = interaction.options.getChannel('channel') || interaction.channel;

      if (!channel || !channel.isTextBased() || !channel.messages?.fetch) {
        return interaction.reply({
          content: '⚠️ This command only works in text-based server channels.',
          flags: 64
        });
      }

      await interaction.reply({
        content: `🧹 Clearing messages in ${channel}...`,
        flags: 64
      });

      let deletedCount = 0;
      let failedCount = 0;
      let before;

      while (true) {
        const messages = await channel.messages.fetch({ limit: 100, before });

        if (messages.size === 0) {
          break;
        }

        const now = Date.now();
        const recentMessages = messages.filter(
          message => now - message.createdTimestamp < MAX_BULK_DELETE_AGE
        );
        const oldMessages = messages.filter(
          message => now - message.createdTimestamp >= MAX_BULK_DELETE_AGE
        );

        if (recentMessages.size > 0) {
          const deleted = await channel.bulkDelete(recentMessages, true);
          deletedCount += deleted.size;
        }

        for (const message of oldMessages.values()) {
          try {
            await message.delete();
            deletedCount++;
          } catch (error) {
            failedCount++;
            console.warn(`Could not delete message ${message.id} in #${channel.name}:`, error.message);
          }
        }

        before = messages.last()?.id;

        if (!before) {
          break;
        }
      }

      return interaction.editReply(
        `✅ Cleared ${deletedCount} messages in ${channel}.${failedCount > 0 ? ` ${failedCount} could not be deleted.` : ''}`
      );
    } catch (error) {
      console.error('Error in /chatclear:', error);

      if (!interaction.replied) {
        return interaction.reply({
          content: '⚠️ Error while clearing the channel.',
          flags: 64
        });
      }

      return interaction.editReply('⚠️ Error while clearing the channel.');
    }
  }
};