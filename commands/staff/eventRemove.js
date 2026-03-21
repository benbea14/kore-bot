const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const bdayService = require('../../bday/bdayService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event-remove')
        .setDescription('Remove an event by ID or name')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID of the event to remove')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the event to remove')
                .setRequired(false)
        ),

    async execute(interaction) {
        const id = interaction.options.getString('id');
        const name = interaction.options.getString('name');

        try {
            let removedCount = 0;

            if (id) {
                const removed = bdayService.removeEvent(id);
                if (removed) removedCount = 1;
            } else if (name) {
                const events = bdayService.getEvents().filter(e => e.name.toLowerCase() === name.toLowerCase());
                for (const e of events) {
                    bdayService.removeEvent(e.id);
                    removedCount++;
                }
            } else {
                return interaction.reply({
                    content: '❌ You must provide either an ID or a name.',
                    flags: 64
                });
            }

            if (removedCount > 0) {
                return interaction.reply({
                    content: `✅ Removed ${removedCount} event(s).`,
                    flags: 64
                });
            } else {
                return interaction.reply({
                    content: '❌ No event found to remove.',
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