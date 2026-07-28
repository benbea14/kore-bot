const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const bdayService = require('../../bday/bdayService');
const { sendBirthdayMessage, sendEventMessage, sendServerMessage } = require('../../bday/bdayMessages');

const LOCAL_IMAGE_PREFIX = 'local:';
const VOLUME_DATA_DIR = '/data';
const FALLBACK_DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LOCAL_IMAGE_DIR = path.join(
    fs.existsSync(VOLUME_DATA_DIR) ? VOLUME_DATA_DIR : FALLBACK_DATA_DIR,
    'bday-images'
);

function ensureLocalImageDir() {
    if (!fs.existsSync(LOCAL_IMAGE_DIR)) {
        fs.mkdirSync(LOCAL_IMAGE_DIR, { recursive: true });
    }
}

function getFileExtension(imageAttachment) {
    const fromName = path.extname(imageAttachment?.name || '').toLowerCase();
    if (fromName) return fromName;

    const contentType = (imageAttachment?.contentType || '').toLowerCase();
    if (contentType === 'image/jpeg') return '.jpg';
    if (contentType === 'image/png') return '.png';
    if (contentType === 'image/gif') return '.gif';
    if (contentType === 'image/webp') return '.webp';

    return '.png';
}

function normalizeLabel(value) {
    return (value || '')
        .trim()
        .replace(/\s*\(left\)\s*$/i, '')
        .toLowerCase();
}

function formatBirthdayLabel(entry) {
    if (!entry?.day || !entry?.month) return null;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName = monthNames[entry.month - 1];
    if (!monthName) return null;

    return `${String(entry.day).padStart(2, '0')}. ${monthName}`;
}

function findBirthdayForTarget(target, birthdays) {
    const normalizedTarget = normalizeLabel(target);

    return birthdays.find(entry => {
        if (entry?.type === 'user') {
            if (entry.userId && normalizeLabel(entry.userId) === normalizedTarget) {
                return true;
            }

            if (entry.displayName && normalizeLabel(entry.displayName) === normalizedTarget) {
                return true;
            }

            if (entry.name && normalizeLabel(entry.name) === normalizedTarget) {
                return true;
            }
        }

        if (entry?.type === 'name' && normalizeLabel(entry.name) === normalizedTarget) {
            return true;
        }

        return false;
    });
}

function getMessageTemplateValue(messageConfig) {
    if (typeof messageConfig === 'string') {
        return messageConfig;
    }

    return messageConfig?.template ?? messageConfig?.text ?? messageConfig?.content ?? '';
}

function ensureMessageSection(data, type) {
    if (!data.messages[type]) {
        data.messages[type] = {};
    }

    return data.messages[type];
}

async function storeAttachmentImage(imageAttachment) {
    if (!imageAttachment) {
        return null;
    }

    if (imageAttachment?.contentType && !imageAttachment.contentType.startsWith('image/')) {
        throw new Error('The uploaded file is not an image.');
    }

    if (!imageAttachment.url) {
        throw new Error('Could not read the uploaded file URL.');
    }

    ensureLocalImageDir();

    const response = await fetch(imageAttachment.url);
    if (!response.ok) {
        throw new Error('Could not download the uploaded image from Discord. Please try again.');
    }

    const extension = getFileExtension(imageAttachment);
    const fileName = `bday_${Date.now()}_${Math.random().toString(16).slice(2)}${extension}`;
    const filePath = path.join(LOCAL_IMAGE_DIR, fileName);
    const buffer = Buffer.from(await response.arrayBuffer());

    fs.writeFileSync(filePath, buffer);

    return `${LOCAL_IMAGE_PREFIX}${fileName}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('Manage reminder messages for birthdays, events and server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        // SET
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set a custom message template')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Birthday', value: 'birthday' },
                            { name: 'Event', value: 'event' },
                            { name: 'Server', value: 'server' }
                        )
                )
                .addAttachmentOption(opt =>
                    opt.setName('image')
                        .setDescription('Optional image attachment for this message')
                        .setRequired(false)
                )
        )

        // PREVIEW
        .addSubcommand(sub =>
            sub.setName('preview')
                .setDescription('Preview a message')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Birthday', value: 'birthday' },
                            { name: 'Event', value: 'event' },
                            { name: 'Server', value: 'server' }
                        )
                )
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('User for preview (birthday)')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('Event name for preview')
                        .setRequired(false)
                )
        )

        // CLEAR
        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('Clear custom message')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Birthday', value: 'birthday' },
                            { name: 'Event', value: 'event' },
                            { name: 'Server', value: 'server' }
                        )
                )
        )

        // USER-SPECIFIC MESSAGE
        .addSubcommand(sub =>
            sub.setName('user-set')
                .setDescription('Set a custom message for a specific user')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Birthday', value: 'birthday' },
                            { name: 'Event', value: 'event' }
                        )
                )
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('Discord user')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('Name to personalize for')
                        .setRequired(false)
                )
                .addAttachmentOption(opt =>
                    opt.setName('image')
                        .setDescription('Optional image attachment for this message')
                        .setRequired(false)
                )
        )

        .addSubcommand(sub =>
            sub.setName('user-remove')
                .setDescription('Remove custom message for a user')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Birthday', value: 'birthday' },
                            { name: 'Event', value: 'event' }
                        )
                )
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('Discord user')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('Name to personalize for')
                        .setRequired(false)
                )
        )

        .addSubcommand(sub =>
            sub.setName('user-list')
                .setDescription('List all user-specific messages')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Birthday', value: 'birthday' },
                            { name: 'Event', value: 'event' }
                        )
                )
                .addIntegerOption(opt =>
                    opt.setName('page')
                        .setDescription('Page number (10 entries per page)')
                        .setRequired(false)
                        .setMinValue(1)
                )
        )

        // IMAGE-ADD
        .addSubcommand(sub =>
            sub.setName('image-add')
                .setDescription('Add an image for message fallback')
                .addAttachmentOption(opt =>
                    opt.setName('image')
                        .setDescription('Upload an image file')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('url')
                        .setDescription('Direct image URL (https://...)')
                        .setRequired(false)
                )
        )

        // IMAGE-LIST
        .addSubcommand(sub =>
            sub.setName('image-list')
                .setDescription('List all message images')
        )

        // IMAGE-REMOVE
        .addSubcommand(sub =>
            sub.setName('image-remove')
                .setDescription('Remove a message image by index')
                .addIntegerOption(opt =>
                    opt.setName('index')
                        .setDescription('Image number from /message image-list')
                        .setRequired(true)
                        .setMinValue(1)
                )
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const type = interaction.options.getString('type');
        const data = bdayService.loadData();

        try {

            // SET
            if (sub === 'set') {
                const imageAttachment = interaction.options.getAttachment('image');
                const modalCustomId = `message_set:${type}:${interaction.id}`;
                const modal = new ModalBuilder()
                    .setCustomId(modalCustomId)
                    .setTitle(`Set ${type.charAt(0).toUpperCase() + type.slice(1)} Message`);

                const templateInput = new TextInputBuilder()
                    .setCustomId('message_template')
                    .setLabel('Message text')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(4000);

                modal.addComponents(new ActionRowBuilder().addComponents(templateInput));

                await interaction.showModal(modal);

                const submitted = await interaction.awaitModalSubmit({
                    filter: i => i.customId === modalCustomId && i.user.id === interaction.user.id,
                    time: 5 * 60 * 1000
                });

                try {
                    const template = submitted.fields.getTextInputValue('message_template')?.trim();
                    const image = imageAttachment ? await storeAttachmentImage(imageAttachment) : null;

                    const section = ensureMessageSection(data, type);
                    section.template = template;

                    if (image) {
                        section.image = image;
                    } else {
                        delete section.image;
                    }

                    bdayService.saveData(data);

                    return submitted.reply({
                        content: `✅ Custom message set for **${type}**${image ? ' with a custom image' : ''}`,
                        flags: 64
                    });
                } catch (error) {
                    console.error('Error in /message set modal submit:', error);

                    const errorMessage = error?.message
                        ? `❌ ${error.message}`
                        : '❌ Could not save the message.';

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
            }

            // PREVIEW
            if (sub === 'preview') {

                const user = interaction.options.getUser('user') || interaction.user;
                const name = interaction.options.getString('name') || "Test Event";

                const dummy = {
                    type: 'user',
                    userId: user.id,
                    name: user.username,
                    day: 1,
                    month: 1,
                    year: 2000,
                    images: []
                };

                if (type === 'birthday') {

                    await sendBirthdayMessage(
                        interaction.client,
                        dummy,
                        interaction.channel
                    );

                    return interaction.reply({
                        content: `✅ Birthday preview sent`,
                        flags: 64
                    });
                }

                else if (type === 'event') {

                    await sendEventMessage(
                        interaction.client,
                        { ...dummy, name },
                        interaction.channel
                    );

                    return interaction.reply({
                        content: `✅ Event preview sent`,
                        flags: 64
                    });

                }

                else if (type === 'server') {
                    await sendServerMessage(
                        interaction.client,
                        interaction.channel
                    );

                    return interaction.reply({
                        content: `✅ Server preview sent`,
                        flags: 64
                    });

                }

                return;
            }

            // CLEAR
            if (sub === 'clear') {

                const defaults = {
                    birthday: { template: "🎂 Happy Birthday {name}! 💜" },
                    event: { template: "📅 Today is {name}! 💜" },
                    server: { template: "🎉 Happy Server Anniversary {server}! 💜" }
                };

                data.messages[type] = defaults[type];
                bdayService.saveData(data);

                return interaction.reply({
                    content: `✅ Custom message for **${type}** cleared`,
                    flags: 64
                });

            }

            // USER-SET (set personalized message for a user)
            if (sub === 'user-set') {

                const userOption = interaction.options.getUser('user');
                const nameOption = interaction.options.getString('name');
                const imageAttachment = interaction.options.getAttachment('image');

                // nameOption takes priority if provided, otherwise use userOption
                const target = nameOption || userOption?.id;
                const displayTarget = nameOption || userOption?.username;

                const modalCustomId = `message_user_set:${type}:${target}:${interaction.id}`;
                const modal = new ModalBuilder()
                    .setCustomId(modalCustomId)
                    .setTitle(`Set ${type.charAt(0).toUpperCase() + type.slice(1)} Message`);

                const templateInput = new TextInputBuilder()
                    .setCustomId('message_template')
                    .setLabel('Personal message text')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(4000);

                modal.addComponents(new ActionRowBuilder().addComponents(templateInput));

                await interaction.showModal(modal);

                const submitted = await interaction.awaitModalSubmit({
                    filter: i => i.customId === modalCustomId && i.user.id === interaction.user.id,
                    time: 5 * 60 * 1000
                });

                try {
                    const template = submitted.fields.getTextInputValue('message_template')?.trim();
                    const image = imageAttachment ? await storeAttachmentImage(imageAttachment) : null;

                    ensureMessageSection(data, type);

                    if (!data.messages[type].userMessages) {
                        data.messages[type].userMessages = {};
                    }

                    data.messages[type].userMessages[target] = {
                        template,
                        image
                    };
                    bdayService.saveData(data);

                    return submitted.reply({
                        content: `✅ Personal message set for **${displayTarget}** on ${type}!${image ? ' Custom image included.' : ''}`,
                        flags: 64
                    });
                } catch (error) {
                    console.error('Error in /message user-set modal submit:', error);

                    const errorMessage = error?.message
                        ? `❌ ${error.message}`
                        : '❌ Could not save the personal message.';

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
            }

            // USER-REMOVE (remove personalized message for a user)
            if (sub === 'user-remove') {

                const userOption = interaction.options.getUser('user');
                const nameOption = interaction.options.getString('name');

                // nameOption takes priority if provided, otherwise use userOption
                const target = nameOption || userOption?.id;
                const displayTarget = nameOption || userOption?.username;

                if (!data.messages[type]?.userMessages || !data.messages[type].userMessages[target]) {
                    return interaction.reply({
                        content: `❌ No personal message found for **${displayTarget}**.`,
                        flags: 64
                    });
                }

                delete data.messages[type].userMessages[target];
                bdayService.saveData(data);

                return interaction.reply({
                    content: `✅ Personal message for **${displayTarget}** removed.`,
                    flags: 64
                });
            }

            // USER-LIST (list all personalized messages)
            if (sub === 'user-list') {

                const userMessages = data.messages[type]?.userMessages;
                const page = interaction.options.getInteger('page') || 1;
                const pageSize = 10;

                if (!userMessages || Object.keys(userMessages).length === 0) {
                    return interaction.reply({
                        content: `❌ No personal messages set for ${type}.`,
                        flags: 64
                    });
                }

                let allEntries = Object.entries(userMessages);

                if (type === 'birthday') {
                    const birthdays = bdayService.getBirthdays();

                    allEntries = allEntries
                        .map(([target, tmpl]) => {
                            const birthdayEntry = findBirthdayForTarget(target, birthdays);
                            const birthdayLabel = birthdayEntry ? formatBirthdayLabel(birthdayEntry) : null;
                            const birthdaySortValue = birthdayEntry ? ((birthdayEntry.month || 0) * 100 + (birthdayEntry.day || 0)) : Number.MAX_SAFE_INTEGER;

                            return { target, tmpl, birthdayEntry, birthdayLabel, birthdaySortValue };
                        })
                        .sort((a, b) => {
                            if (a.birthdaySortValue !== b.birthdaySortValue) {
                                return a.birthdaySortValue - b.birthdaySortValue;
                            }
                            return a.target.localeCompare(b.target);
                        })
                        .map(({ target, tmpl }) => [target, tmpl]);
                }

                const totalPages = Math.max(1, Math.ceil(allEntries.length / pageSize));

                if (page > totalPages) {
                    return interaction.reply({
                        content: `❌ Invalid page. Please choose a page between 1 and ${totalPages}.`,
                        flags: 64
                    });
                }

                const start = (page - 1) * pageSize;
                const pagedEntries = allEntries.slice(start, start + pageSize);

                const embed = new EmbedBuilder()
                    .setTitle(`Personal Messages - ${type}`)
                    .setColor(0x9B59B6)
                    .setFooter({ text: `Page ${page}/${totalPages} • Total: ${allEntries.length}` })
                    .setTimestamp();

                const birthdays = type === 'birthday' ? bdayService.getBirthdays() : [];

                // Fetch user nicknames for display
                const promises = pagedEntries.map(async ([target, tmpl]) => {
                    let displayName = target;
                    let birthdayLabel = null;
                    
                    // If target looks like a user ID (numeric), fetch the user to get their username
                    if (/^\d{17,19}$/.test(target)) {
                        try {
                            const user = await interaction.client.users.fetch(target);
                            displayName = user.username;
                        } catch (err) {
                            // If fetch fails, use the ID as fallback
                            displayName = target;
                        }
                    }

                    if (type === 'birthday') {
                        const birthdayEntry = findBirthdayForTarget(target, birthdays);
                        birthdayLabel = birthdayEntry ? formatBirthdayLabel(birthdayEntry) : null;
                    }

                    const templateValue = getMessageTemplateValue(tmpl);

                    const prefix = birthdayLabel ? `👤 ${displayName} | ${birthdayLabel}` : `👤 ${displayName}`;
                    
                    return { 
                        name: prefix,
                        value: templateValue.length > 100 ? templateValue.substring(0, 100) + '...' : templateValue
                    };
                });

                const fields = await Promise.all(promises);
                fields.forEach(field => embed.addFields(field));

                return interaction.reply({ embeds: [embed] });
            }

            // IMAGE-ADD (add image to birthday message image pool)
            if (sub === 'image-add') {

                const imageAttachment = interaction.options.getAttachment('image');
                const imageUrl = interaction.options.getString('url');

                if (!imageAttachment && !imageUrl) {
                    return interaction.reply({
                        content: '❌ Please provide either an uploaded image or an image URL.',
                        flags: 64
                    });
                }

                let candidateUrl = imageAttachment?.url || imageUrl?.trim();

                let parsed;
                try {
                    parsed = new URL(candidateUrl);
                } catch {
                    return interaction.reply({
                        content: '❌ Invalid URL. Please use a direct http(s) image URL.',
                        flags: 64
                    });
                }

                if (!['http:', 'https:'].includes(parsed.protocol)) {
                    return interaction.reply({
                        content: '❌ URL must start with http:// or https://',
                        flags: 64
                    });
                }

                if (imageAttachment?.contentType && !imageAttachment.contentType.startsWith('image/')) {
                    return interaction.reply({
                        content: '❌ The uploaded file is not an image.',
                        flags: 64
                    });
                }

                if (imageAttachment) {
                    ensureLocalImageDir();

                    const response = await fetch(candidateUrl);
                    if (!response.ok) {
                        return interaction.reply({
                            content: '❌ Could not download the uploaded image from Discord. Please try again.',
                            flags: 64
                        });
                    }

                    const extension = getFileExtension(imageAttachment);
                    const fileName = `bday_${Date.now()}_${Math.random().toString(16).slice(2)}${extension}`;
                    const filePath = path.join(LOCAL_IMAGE_DIR, fileName);
                    const buffer = Buffer.from(await response.arrayBuffer());

                    fs.writeFileSync(filePath, buffer);

                    // Store local images as `local:filename.ext` so they survive attachment URL expiry.
                    candidateUrl = `${LOCAL_IMAGE_PREFIX}${fileName}`;
                }

                if (!data.messages.birthday) {
                    data.messages.birthday = {
                        template: '🎂 Happy Birthday {name}! 💜',
                        useEmbed: true
                    };
                }

                if (!Array.isArray(data.messages.birthday.images)) {
                    data.messages.birthday.images = [];
                }

                if (data.messages.birthday.images.includes(candidateUrl)) {
                    return interaction.reply({
                        content: '⚠️ This image is already in the message image list.',
                        flags: 64
                    });
                }

                data.messages.birthday.images.push(candidateUrl);
                bdayService.saveData(data);

                return interaction.reply({
                    content: `✅ Message image added. Total images: **${data.messages.birthday.images.length}**`,
                    flags: 64
                });
            }

            // IMAGE-LIST (list all birthday images)
            if (sub === 'image-list') {

                const images = data.messages?.birthday?.images || [];

                if (images.length === 0) {
                    return interaction.reply({
                        content: '❌ No message images configured yet.',
                        flags: 64
                    });
                }

                const list = images
                    .map((url, index) => {
                        if (typeof url === 'string' && url.startsWith(LOCAL_IMAGE_PREFIX)) {
                            return `${index + 1}. [local file] ${url.slice(LOCAL_IMAGE_PREFIX.length)}`;
                        }

                        return `${index + 1}. ${url}`;
                    })
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setColor(0x9B59B6)
                    .setTitle('Message Images')
                    .setDescription(list.length > 4000 ? `${list.slice(0, 3950)}\n...` : list)
                    .setFooter({ text: `Total images: ${images.length}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            // IMAGE-REMOVE (remove birthday image by index)
            if (sub === 'image-remove') {

                const index = interaction.options.getInteger('index');
                const images = data.messages?.birthday?.images || [];

                if (images.length === 0) {
                    return interaction.reply({
                        content: '❌ No message images configured.',
                        flags: 64
                    });
                }

                if (index < 1 || index > images.length) {
                    return interaction.reply({
                        content: `❌ Invalid index. Please choose a number between 1 and ${images.length}.`,
                        flags: 64
                    });
                }

                const removed = images.splice(index - 1, 1)[0];

                if (typeof removed === 'string' && removed.startsWith(LOCAL_IMAGE_PREFIX)) {
                    const localName = removed.slice(LOCAL_IMAGE_PREFIX.length);
                    const localPath = path.join(LOCAL_IMAGE_DIR, localName);

                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                    }
                }

                data.messages.birthday.images = images;
                bdayService.saveData(data);

                return interaction.reply({
                    content: `✅ Removed image #${index}: ${removed}`,
                    flags: 64
                });
            }

        }

        catch (err) {
            console.error(err);

            return interaction.reply({
                content: '❌ Something went wrong.',
                flags: 64
            });
        }
    }
};
