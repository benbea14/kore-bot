const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const bdayService = require('../../bday/bdayService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event-remove')
        .setDescription('Remove an event by name')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the event to remove')
                .setRequired(true)
        ),

    async execute(interaction) {
        const name = interaction.options.getString('name');

        try {
            const removed = bdayService.removeEvent(name);

            if (removed) {
                return interaction.reply({
                    content: `✅ Event **${name}** removed.`,
                    flags: 64
                });
            } else {
                return interaction.reply({
                    content: `❌ Event **${name}** not found.`,
                    flags: 64
                });
            }

        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: '❌ Something went wrong.',
                flags: 64
            });
        }
    }
};