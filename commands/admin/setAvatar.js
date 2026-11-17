const { SlashCommandBuilder } = require('discord.js');

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
]);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setavatar')
    .setDescription("Changes Kora's profile picture (Bot owner only)")
    .addAttachmentOption(option =>
      option
        .setName('image')
        .setDescription('The new profile picture (leave empty to remove instead)')
    )
    .addBooleanOption(option =>
      option
        .setName('remove')
        .setDescription("Remove Kora's current profile picture")
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.USER_ID) {
      return interaction.reply({
        content: 'Only for the Bot Owner.',
        flags: 64
      });
    }

    const removeAvatar = interaction.options.getBoolean('remove') ?? false;
    const image = interaction.options.getAttachment('image');

    if (!removeAvatar && !image) {
      return interaction.reply({
        content: 'Upload an image or set `remove` to `true`.',
        flags: 64
      });
    }

    if (removeAvatar && image) {
      return interaction.reply({
        content: 'Choose either an image or `remove`, not both.',
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      if (removeAvatar) {
        await interaction.client.user.setAvatar(null);
        return interaction.editReply("✅ Kora's profile picture has been removed.");
      }

      const contentType = (image.contentType || '').split(';')[0].toLowerCase();

      if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
        return interaction.editReply('Please upload a PNG, JPEG, GIF, or WebP image.');
      }

      if (image.size > MAX_AVATAR_SIZE) {
        return interaction.editReply('The image must be 10 MiB or smaller.');
      }

      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error(`Image download failed with HTTP ${response.status}`);
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      if (imageBuffer.length > MAX_AVATAR_SIZE) {
        return interaction.editReply('The image must be 10 MiB or smaller.');
      }

      await interaction.client.user.setAvatar(imageBuffer);
      return interaction.editReply("✅ Kora's profile picture has been updated.");
    } catch (error) {
      console.error('Error in /setavatar:', error);
      return interaction.editReply(
        "⚠️ Could not update Kora's profile picture. Check the image and try again later."
      );
    }
  }
};
