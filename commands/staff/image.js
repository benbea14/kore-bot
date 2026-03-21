const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const bdayService = require('../../bday/bdayService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('Manage images for birthdays, events or server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        // ADD
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add an image')
                .addStringOption(opt => opt.setName('type').setDescription('Type: birthday, event, server').setRequired(true)
                    .addChoices(
                        { name: 'Birthday', value: 'birthday' },
                        { name: 'Event', value: 'event' },
                        { name: 'Server', value: 'server' }
                    )
                )
                .addUserOption(opt => opt.setName('user').setDescription('Select user for birthday/event (optional)').setRequired(false))
                .addAttachmentOption(opt => opt.setName('attachment').setDescription('Upload an image from Discord'))
                .addStringOption(opt => opt.setName('url').setDescription('Or provide an image URL'))
        )

        // REMOVE
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove an image')
                .addStringOption(opt => opt.setName('type').setDescription('Type: birthday, event, server').setRequired(true)
                    .addChoices(
                        { name: 'Birthday', value: 'birthday' },
                        { name: 'Event', value: 'event' },
                        { name: 'Server', value: 'server' }
                    )
                )
                .addIntegerOption(opt => opt.setName('index').setDescription('Index of image to remove').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('Select user for birthday/event (optional)').setRequired(false))
        )

        // LIST
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List images for an entry')
                .addStringOption(opt => opt.setName('type').setDescription('Type: birthday, event, server').setRequired(true)
                    .addChoices(
                        { name: 'Birthday', value: 'birthday' },
                        { name: 'Event', value: 'event' },
                        { name: 'Server', value: 'server' }
                    )
                )
                .addUserOption(opt => opt.setName('user').setDescription('Select user for birthday/event (optional)').setRequired(false))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const type = interaction.options.getString('type');
        const data = bdayService.loadData();

        try {
            const user = interaction.options.getUser('user');
            let entryKey;

            if (type === 'birthday') entryKey = data.birthdays.find(e => e.id === user?.id) || { images: [] };
            else if (type === 'event') entryKey = data.events.find(e => e.id === user?.id) || { images: [] };
            else entryKey = data.server || { images: [] };

            // ADD IMAGE
            if (sub === 'add') {
                const attachment = interaction.options.getAttachment('attachment');
                const url = interaction.options.getString('url');
                const imageUrl = attachment?.url || url;
                if (!imageUrl) return interaction.reply({ content: '❌ Provide an attachment or URL.', flags: 64 });

                entryKey.images = entryKey.images || [];
                entryKey.images.push(imageUrl);
                bdayService.saveData(data);
                return interaction.reply({ content: `✅ Image added for ${type}!`, flags: 64 });
            }

            // REMOVE IMAGE
            if (sub === 'remove') {
                const index = interaction.options.getInteger('index') - 1;
                if (!entryKey.images || index < 0 || index >= entryKey.images.length) return interaction.reply({ content: '❌ Invalid index.', flags: 64 });
                entryKey.images.splice(index, 1);
                bdayService.saveData(data);
                return interaction.reply({ content: `✅ Image removed from ${type}!`, flags: 64 });
            }

            // LIST IMAGES AS EMBED
            if (sub === 'list') {
                if (!entryKey.images || entryKey.images.length === 0) return interaction.reply({ content: `❌ No images for ${type}`, flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle(`Images for ${type}${user ? `: ${user.username}` : ''}`)
                    .setColor(0x9B59B6)
                    .setTimestamp();

                entryKey.images.forEach((url, i) => {
                    embed.addFields({ name: `#${i + 1}`, value: url });
                });

                return interaction.reply({ embeds: [embed] });
            }

        } catch (err) {
            console.error(err);
            return interaction.reply({ content: '❌ Something went wrong.', flags: 64 });
        }
    }
};