const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const bdayService = require('../../bday/bdayService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bday-remove')
        .setDescription('Remove a birthday by ID or user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID of the birthday to remove')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove the birthday for')
                .setRequired(false)
        ),

    async execute(interaction) {
        const id = interaction.options.getString('id');
        const user = interaction.options.getUser('user');

        try {
            let removedCount = 0;

            if (id) {
                // per ID löschen
                const removed = bdayService.removeBirthday(id);
                if (removed) removedCount = 1;
            } else if (user) {
                // per User ID löschen
                const birthdays = bdayService.getBirthdays().filter(b => b.userId === user.id);
                for (const b of birthdays) {
                    bdayService.removeBirthday(b.id);
                    removedCount++;
                }
            } else {
                return interaction.reply({
                    content: '❌ You must provide either an ID or a user.',
                    flags: 64
                });
            }

            if (removedCount > 0) {
                return interaction.reply({
                    content: `✅ Removed ${removedCount} birthday(s).`,
                    flags: 64
                });
            } else {
                return interaction.reply({
                    content: '❌ No birthday found to remove.',
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