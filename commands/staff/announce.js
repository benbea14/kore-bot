const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const BUTTON_STYLE_MAP = {
  primary: ButtonStyle.Primary,
  secondary: ButtonStyle.Secondary,
  success: ButtonStyle.Success,
  danger: ButtonStyle.Danger
};

function parseRoleReference(guild, rawRole) {
  const trimmedRole = rawRole.trim();
  const roleId = trimmedRole.match(/^<@&(\d+)>$/)?.[1] || (trimmedRole.match(/^\d+$/)?.[0] ?? null);

  if (roleId) {
    return guild.roles.cache.get(roleId) ?? null;
  }

  return guild.roles.cache.find(role => role.name.toLowerCase() === trimmedRole.toLowerCase()) ?? null;
}

function buildRoleButtonRows(guild, rawButtonConfig) {
  if (!rawButtonConfig?.trim()) {
    return [];
  }

  const lines = rawButtonConfig
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length > 25) {
    throw new Error('You can add at most 25 role buttons at once.');
  }

  const buttons = lines.map((line, index) => {
    const parts = line.split('|').map(part => part.trim());

    if (parts.length < 2 || parts.length > 3) {
      throw new Error(`Line ${index + 1} must use: Label | Role | Style(optional)`);
    }

    const [label, rawRole, rawStyle] = parts;
    if (!label) {
      throw new Error(`Line ${index + 1} is missing a button label.`);
    }

    if (label.length > 80) {
      throw new Error(`Line ${index + 1} label is too long. Discord buttons allow up to 80 characters.`);
    }

    const role = parseRoleReference(guild, rawRole);
    if (!role) {
      throw new Error(`Line ${index + 1} could not find the role "${rawRole}".`);
    }

    const styleKey = (rawStyle || 'primary').toLowerCase();
    const style = BUTTON_STYLE_MAP[styleKey];

    if (!style) {
      throw new Error(`Line ${index + 1} has invalid style "${rawStyle}". Use primary, secondary, success, or danger.`);
    }

    return new ButtonBuilder()
      .setCustomId(`announce_role:${role.id}`)
      .setLabel(label)
      .setStyle(style);
  });

  const rows = [];
  for (let index = 0; index < buttons.length; index += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(index, index + 5)));
  }

  return rows;
}

function getAnnounceErrorMessage(error) {
  if (error?.message) {
    return `❌ ${error.message}`;
  }

  return '❌ Could not send the announcement. Check my channel permissions and input format.';
}

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
          ChannelType.GuildVoice,
          ChannelType.GuildStageVoice,
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

      const buttonsInput = new TextInputBuilder()
        .setCustomId('announce_buttons')
        .setLabel('Role buttons: Label | Role | Style(optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(4000)
        .setPlaceholder('RM 🐨 | 🐨 RM | primary\n💜 I agree | ARMY | success');

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(textInput),
        new ActionRowBuilder().addComponents(buttonsInput)
      );

      await interaction.showModal(modal);

      const submitted = await interaction.awaitModalSubmit({
        filter: i => i.customId === modalCustomId && i.user.id === interaction.user.id,
        time: 5 * 60 * 1000
      });

      try {
        const title = submitted.fields.getTextInputValue('announce_title')?.trim();
        const text = submitted.fields.getTextInputValue('announce_text');
        const rawButtonConfig = submitted.fields.getTextInputValue('announce_buttons');
        const buttonRows = buildRoleButtonRows(interaction.guild, rawButtonConfig);

        if (useEmbed) {
          const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(text)
            .setTimestamp();

          if (title) {
            embed.setTitle(title);
          }

          await channel.send({ embeds: [embed], components: buttonRows });
        } else {
          const content = title ? `**${title}**\n${text}` : text;
          await channel.send({ content, components: buttonRows });
        }

        return submitted.reply({
          content: `✅ Announcement sent to ${channel}${useEmbed ? ' as an embed' : ''}${buttonRows.length ? ' with role buttons' : ''}.`,
          flags: 64
        });
      } catch (error) {
        console.error('Error in /announce modal submit:', error);
        const errorMessage = getAnnounceErrorMessage(error);

        if (submitted.replied || submitted.deferred) {
          return submitted.followUp({
            content: errorMessage,
            flags: 64
          });
        }

        return submitted.reply({
          content: errorMessage,
          flags: 64
        });
      }
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
