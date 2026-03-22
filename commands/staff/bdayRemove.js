const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const bdayService = require('../../bday/bdayService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bday-remove')
        .setDescription('Remove a birthday by user or name')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove the birthday for')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name to remove the birthday for')
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const name = interaction.options.getString('name');

        try {
            if (!user && !name) {
                return interaction.reply({
                    content: '❌ You must provide either a user or a name.',
                    flags: 64
                });
            }

            if (user && name) {
                return interaction.reply({
                    content: '❌ Please provide only user OR name, not both.',
                    flags: 64
                });
            }

            let removed = false;

            if (user) {
                removed = bdayService.removeBirthday({ type: 'user', userId: user.id });
            } else if (name) {
                removed = bdayService.removeBirthday({ type: 'name', name });
            }

            if (removed) {
                const target = user?.username || name;
                return interaction.reply({
                    content: `✅ Birthday for **${target}** removed.`,
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