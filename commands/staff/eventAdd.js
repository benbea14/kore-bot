const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const bdayService = require('../../bday/bdayService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event-add')
        .setDescription('Add an event')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Event name')
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
        .addBooleanOption(option =>
            option.setName('recurring')
                .setDescription('Should the event repeat every year?')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const name = interaction.options.getString('name');
            const day = interaction.options.getInteger('day');
            const month = interaction.options.getInteger('month');
            const year = interaction.options.getInteger('year');
            const recurring = interaction.options.getBoolean('recurring') ?? false;

            const event = bdayService.addEvent({ name, day, month, year, recurring });

            return interaction.reply({
                content: `✅ Event **${name}** added!\nID: \`${event.id}\``,
                flags: 64
            });

        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: '❌ Something went wrong.',
                flags: 64
            });
        }
    }
};