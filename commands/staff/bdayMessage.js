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
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const type = interaction.options.getString('type');
        const data = bdayService.loadData();

        try {

            // SET
            if (sub === 'set') {

                const template = interaction.options.getString('template');

                data.messages[type] = { template };
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