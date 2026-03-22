const { 
    SlashCommandBuilder, 
    PermissionFlagsBits 
} = require('discord.js');

const bdayService = require('../../bday/bdayService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bday')
        .setDescription('Manage birthdays')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        // USER
        .addSubcommand(sub =>
            sub
                .setName('add-user')
                .setDescription('Add a Discord user birthday')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The Discord user')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('day')
                        .setDescription('Birth day (1-31)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Birth month (1-12)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))
                .addIntegerOption(option =>
                    option.setName('year')
                        .setDescription('Birth year')
                        .setRequired(false))
        )

        // CUSTOM NAME (BTS etc.)
        .addSubcommand(sub =>
            sub
                .setName('add-name')
                .setDescription('Add a custom name birthday')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Any name you want')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('day')
                        .setDescription('Day (1-31)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Month (1-12)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))
                .addIntegerOption(option =>
                    option.setName('year')
                        .setDescription('Year')
                        .setRequired(false))
        )

        // SERVER
        .addSubcommand(sub =>
            sub
                .setName('add-server')
                .setDescription('Set server anniversary')
                .addIntegerOption(option =>
                    option.setName('day')
                        .setDescription('Day (1-31)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Month (1-12)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))
                .addIntegerOption(option =>
                    option.setName('year')
                        .setDescription('Year created')
                        .setRequired(false))
        ),

    async execute(interaction) {

        const subcommand = interaction.options.getSubcommand();

        try {

            // ADD USER
            if (subcommand === 'add-user') {

                const user = interaction.options.getUser('user');
                const day = interaction.options.getInteger('day');
                const month = interaction.options.getInteger('month');
                const year = interaction.options.getInteger('year');

                const entry = bdayService.addBirthday({
                    type: "user",
                    userId: user.id,
                    day,
                    month,
                    year
                });

                return interaction.reply({
                    content: `✅ Birthday added for ${user.tag}\nID: \`${entry.id}\``,
                    flags: 64
                });
            }

            // ADD CUSTOM NAME
            if (subcommand === 'add-name') {

                const name = interaction.options.getString('name');
                const day = interaction.options.getInteger('day');
                const month = interaction.options.getInteger('month');
                const year = interaction.options.getInteger('year');

                const entry = bdayService.addBirthday({
                    type: "name",
                    name,
                    day,
                    month,
                    year
                });

                return interaction.reply({
                    content: `✅ Member birthday added for ${name}\nID: \`${entry.id}\``,
                    flags: 64
                });
            }

            // ADD SERVER
            if (subcommand === 'add-server') {

                const day = interaction.options.getInteger('day');
                const month = interaction.options.getInteger('month');
                const year = interaction.options.getInteger('year');

                const data = bdayService.loadData();

                data.server = {
                    id: "server_001",
                    day,
                    month,
                    year,
                    recurring: true,
                    images: []
                };

                bdayService.saveData(data);

                return interaction.reply({
                    content: `✅ Server anniversary set!`,
                    flags: 64
                });
            }

        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: "❌ Something went wrong.",
                flags: 64
            });
        }
    }
};