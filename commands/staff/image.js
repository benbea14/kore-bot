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
                .setDescription('Add an image to message template')
                .addStringOption(opt => opt.setName('type').setDescription('Type: birthday, event, server').setRequired(true)
                    .addChoices(
                        { name: 'Birthday', value: 'birthday' },
                        { name: 'Event', value: 'event' },
                        { name: 'Server', value: 'server' }
                    )
                )
                .addAttachmentOption(opt => opt.setName('attachment').setDescription('Upload an image from Discord'))
                .addStringOption(opt => opt.setName('url').setDescription('Or provide an image URL'))
        )

        // REMOVE
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove an image from message template')
                .addStringOption(opt => opt.setName('type').setDescription('Type: birthday, event, server').setRequired(true)
                    .addChoices(
                        { name: 'Birthday', value: 'birthday' },
                        { name: 'Event', value: 'event' },
                        { name: 'Server', value: 'server' }
                    )
                )
                .addIntegerOption(opt => opt.setName('index').setDescription('Index of image to remove').setRequired(true))
        )

        // LIST
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List images for message template')
                .addStringOption(opt => opt.setName('type').setDescription('Type: birthday, event, server').setRequired(true)
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
            if (!data.messages[type]) {
                data.messages[type] = { images: [] };
            }

            const messageConfig = data.messages[type];
            messageConfig.images = messageConfig.images || [];

            // ADD IMAGE
            if (sub === 'add') {
                const attachment = interaction.options.getAttachment('attachment');
                const url = interaction.options.getString('url');
                const imageUrl = attachment?.url || url;
                if (!imageUrl) return interaction.reply({ content: '❌ Provide an attachment or URL.', flags: 64 });

                messageConfig.images.push(imageUrl);
                bdayService.saveData(data);
                return interaction.reply({ content: `✅ Image added to ${type} messages!`, flags: 64 });
            }

            // REMOVE IMAGE
            if (sub === 'remove') {
                const index = interaction.options.getInteger('index') - 1;
                if (index < 0 || index >= messageConfig.images.length) return interaction.reply({ content: '❌ Invalid index.', flags: 64 });
                messageConfig.images.splice(index, 1);
                bdayService.saveData(data);
                return interaction.reply({ content: `✅ Image removed from ${type} messages!`, flags: 64 });
            }

            // LIST IMAGES
            if (sub === 'list') {
                if (messageConfig.images.length === 0) return interaction.reply({ content: `❌ No images for ${type} messages`, flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle(`Images for ${type} messages`)
                    .setColor(0x9B59B6)
                    .setTimestamp();

                messageConfig.images.forEach((url, i) => {
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