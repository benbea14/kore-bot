const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const bdayService = require('../../bday/bdayService');
const { sendBirthdayMessage, sendEventMessage, sendServerMessage } = require('../../bday/bdayMessages');

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
                .addStringOption(opt =>
                    opt.setName('template')
                        .setDescription('Message template with placeholders')
                        .setRequired(true)
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
                .addStringOption(opt =>
                    opt.setName('template')
                        .setDescription('Custom message for this user')
                        .setRequired(true)
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
        )

        // IMAGE-ADD
        .addSubcommand(sub =>
            sub.setName('image-add')
                .setDescription('Add an image for birthday messages')
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
                .setDescription('List all birthday message images')
        )

        // IMAGE-REMOVE
        .addSubcommand(sub =>
            sub.setName('image-remove')
                .setDescription('Remove a birthday message image by index')
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

                const template = interaction.options.getString('template');

                if (!data.messages[type]) {
                    data.messages[type] = {};
                }

                data.messages[type].template = template;
                bdayService.saveData(data);

                return interaction.reply({
                    content: `✅ Custom message set for **${type}**`,
                    flags: 64
                });
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
                const template = interaction.options.getString('template');

                // nameOption takes priority if provided, otherwise use userOption
                const target = nameOption || userOption?.id;
                const displayTarget = nameOption || userOption?.username;

                if (!data.messages[type]) {
                    data.messages[type] = {};
                }

                if (!data.messages[type].userMessages) {
                    data.messages[type].userMessages = {};
                }

                data.messages[type].userMessages[target] = template;
                bdayService.saveData(data);

                return interaction.reply({
                    content: `✅ Personal message set for **${displayTarget}** on ${type}!`,
                    flags: 64
                });
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

                if (!userMessages || Object.keys(userMessages).length === 0) {
                    return interaction.reply({
                        content: `❌ No personal messages set for ${type}.`,
                        flags: 64
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Personal Messages - ${type}`)
                    .setColor(0x9B59B6)
                    .setTimestamp();

                // Fetch user nicknames for display
                const promises = Object.entries(userMessages).map(async ([target, tmpl]) => {
                    let displayName = target;
                    
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
                    
                    return { 
                        name: `👤 ${displayName}`, 
                        value: tmpl.length > 100 ? tmpl.substring(0, 100) + '...' : tmpl 
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

                const candidateUrl = imageAttachment?.url || imageUrl?.trim();

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
                        content: '⚠️ This image is already in the birthday image list.',
                        flags: 64
                    });
                }

                data.messages.birthday.images.push(candidateUrl);
                bdayService.saveData(data);

                return interaction.reply({
                    content: `✅ Birthday image added. Total images: **${data.messages.birthday.images.length}**`,
                    flags: 64
                });
            }

            // IMAGE-LIST (list all birthday images)
            if (sub === 'image-list') {

                const images = data.messages?.birthday?.images || [];

                if (images.length === 0) {
                    return interaction.reply({
                        content: '❌ No birthday images configured yet.',
                        flags: 64
                    });
                }

                const list = images
                    .map((url, index) => `${index + 1}. ${url}`)
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setColor(0x9B59B6)
                    .setTitle('Birthday Message Images')
                    .setDescription(list.length > 4000 ? `${list.slice(0, 3950)}\n...` : list)
                    .setFooter({ text: `Total images: ${images.length}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            // IMAGE-REMOVE (remove birthday image by index)
            if (sub === 'image-remove') {

                const index = interaction.options.getInteger('index');
                const images = data.messages?.birthday?.images || [];

                if (images.length === 0) {
                    return interaction.reply({
                        content: '❌ No birthday images configured.',
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
