const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dailyService = require('../../daily/dailyService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Manage daily messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        // ON/OFF
        .addSubcommand(sub => sub.setName('on').setDescription('Enable daily messages'))
        .addSubcommand(sub => sub.setName('off').setDescription('Disable daily messages'))

        // CHANNEL
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Set the daily channel')
                .addChannelOption(opt =>
                    opt.setName('channel')
                       .setDescription('Channel for daily messages')
                       .setRequired(true)
                )
        )

        // ADD/REMOVE/LIST MESSAGE
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a daily message')
                .addStringOption(opt =>
                    opt.setName('text')
                       .setDescription('Message text (supports {server}, {day}, {date})')
                       .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('category')
                       .setDescription('Category (must match a slot category)')
                       .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove a daily message by index')
                .addIntegerOption(opt =>
                    opt.setName('index')
                       .setDescription('Index from /daily list')
                       .setRequired(true)
                )
        )
        .addSubcommand(sub => sub.setName('list').setDescription('List all daily messages'))

        // SLOT-ADD/REMOVE/LIST
        .addSubcommand(sub =>
            sub.setName('slot-add')
                .setDescription('Add a daily time slot')
                .addIntegerOption(opt => opt.setName('hour').setDescription('0-23').setRequired(true).setMinValue(0).setMaxValue(23))
                .addIntegerOption(opt => opt.setName('minute').setDescription('0-59').setRequired(true).setMinValue(0).setMaxValue(59))
                .addStringOption(opt => opt.setName('category').setDescription('Category (morning, evening)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('slot-remove')
                .setDescription('Remove a slot by index')
                .addIntegerOption(opt => opt.setName('index').setDescription('Index from /daily slot-list').setRequired(true))
        )
        .addSubcommand(sub => sub.setName('slot-list').setDescription('List all daily time slots')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const data = dailyService.loadData();

        try {
            // ON / OFF
            if (sub === 'on' || sub === 'off') {
                data.enabled = sub === 'on';
                dailyService.saveData(data);
                return interaction.reply({ content: sub === 'on' ? '✅ Daily messages enabled.' : '❌ Daily messages disabled.', flags: 64 });
            }

            // CHANNEL
            if (sub === 'channel') {
                const channel = interaction.options.getChannel('channel');
                data.channel_id = channel.id;
                dailyService.saveData(data);
                return interaction.reply({ content: `📌 Daily channel set to ${channel}`, flags: 64 });
            }

            // ADD MESSAGE
            if (sub === 'add') {
                const text = interaction.options.getString('text');
                const category = interaction.options.getString('category').toLowerCase();
                data.messages.push({ text, category });
                dailyService.saveData(data);
                return interaction.reply({ content: `💜 Daily message added to category "${category}".`, flags: 64 });
            }

            // REMOVE MESSAGE
            if (sub === 'remove') {
                const index = interaction.options.getInteger('index') - 1;
                if (index < 0 || index >= data.messages.length) return interaction.reply({ content: '❌ Invalid index.', flags: 64 });
                data.messages.splice(index, 1);
                dailyService.saveData(data);
                return interaction.reply({ content: '🗑 Daily message removed.', flags: 64 });
            }

            // LIST MESSAGES AS EMBED
            if (sub === 'list') {
                if (!data.messages.length) return interaction.reply({ content: '❌ No daily messages set.', flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle('📜 Daily Messages')
                    .setColor(0x9B59B6)
                    .setFooter({ text: `Total messages: ${data.messages.length}` })
                    .setTimestamp();

                data.messages.forEach((msg, i) => {
                    embed.addFields({ name: `#${i + 1} [${msg.category}]`, value: msg.text });
                });

                return interaction.reply({ embeds: [embed] });
            }

            // SLOT ADD
            if (sub === 'slot-add') {
                const hour = interaction.options.getInteger('hour');
                const minute = interaction.options.getInteger('minute');
                const category = interaction.options.getString('category').toLowerCase();

                if (data.slots.length >= 2) return interaction.reply({ content: '❌ Maximum of 2 slots allowed.', flags: 64 });
                if (data.slots.find(s => s.hour === hour && s.minute === minute)) return interaction.reply({ content: '❌ This slot already exists.', flags: 64 });

                data.slots.push({ hour, minute, category });
                dailyService.saveData(data);

                return interaction.reply({ content: `⏰ Slot added: ${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')} (${category})`, flags: 64 });
            }

            // SLOT REMOVE
            if (sub === 'slot-remove') {
                const index = interaction.options.getInteger('index') - 1;
                if (index < 0 || index >= data.slots.length) return interaction.reply({ content: '❌ Invalid index.', flags: 64 });
                const removed = data.slots.splice(index, 1)[0];
                dailyService.saveData(data);
                return interaction.reply({ content: `🗑 Removed slot ${removed.hour.toString().padStart(2,'0')}:${removed.minute.toString().padStart(2,'0')}`, flags: 64 });
            }

            // SLOT LIST
            if (sub === 'slot-list') {
                if (!data.slots.length) return interaction.reply({ content: '❌ No daily slots set.', flags: 64 });

                const embed = new EmbedBuilder()
                    .setTitle('⏰ Daily Time Slots')
                    .setColor(0x9B59B6)
                    .setFooter({ text: `Total slots: ${data.slots.length}` })
                    .setTimestamp();

                data.slots.forEach((s, i) => {
                    embed.addFields({ name: `#${i + 1}`, value: `${s.hour.toString().padStart(2,'0')}:${s.minute.toString().padStart(2,'0')} (${s.category})` });
                });

                return interaction.reply({ embeds: [embed] });
            }

        } catch (err) {
            console.error(err);
            return interaction.reply({ content: '❌ Something went wrong.', flags: 64 });
        }
    }
};