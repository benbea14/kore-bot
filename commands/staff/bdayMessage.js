const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const bdayService = require('../../bday/bdayService');
const { sendBirthdayMessage, sendEventMessage } = require('../../bday/bdayMessages');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bday-message')
        .setDescription('Manage reminder messages')
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
                        .setRequired(false)
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
                        .setRequired(false)
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

                    const template =
                        data.messages.server?.template ||
                        "🎉 Happy Server Anniversary {server}! 💜";

                    const embed = new EmbedBuilder()
                        .setTitle("Server Preview")
                        .setDescription(
                            template.replace(/{server}/g, interaction.guild.name)
                        )
                        .setColor(0x9B59B6)
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });

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

                if (!userOption && !nameOption) {
                    return interaction.reply({
                        content: '❌ Please provide either a user or a name.',
                        flags: 64
                    });
                }

                if (userOption && nameOption) {
                    return interaction.reply({
                        content: '❌ Please provide only user OR name, not both.',
                        flags: 64
                    });
                }

                const target = userOption?.id || nameOption;
                const displayTarget = userOption?.username || nameOption;

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

                if (!userOption && !nameOption) {
                    return interaction.reply({
                        content: '❌ Please provide either a user or a name.',
                        flags: 64
                    });
                }

                if (userOption && nameOption) {
                    return interaction.reply({
                        content: '❌ Please provide only user OR name, not both.',
                        flags: 64
                    });
                }

                const target = userOption?.id || nameOption;
                const displayTarget = userOption?.username || nameOption;

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

                Object.entries(userMessages).forEach(([target, tmpl]) => {
                    embed.addFields({ 
                        name: `👤 ${target}`, 
                        value: tmpl.length > 100 ? tmpl.substring(0, 100) + '...' : tmpl
                    });
                });

                return interaction.reply({ embeds: [embed] });
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
