const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const bdayService = require('../../bday/bdayService');

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List birthdays or events')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('type')
                .setDescription('What to list?')
                .setRequired(true)
                .addChoices(
                    { name: 'Birthdays', value: 'bdays' },
                    { name: 'Events', value: 'events' }
                )),

    async execute(interaction) {
        const type = interaction.options.getString('type');

        try {
            let entries = [];
            let title = '';
            let color = 0x9B59B6;

            const data = bdayService.loadData();

            if (type === 'bdays') {
                entries = bdayService.getBirthdays();
                title = '🎂 Birthdays';
                color = 0x9B59B6;
            } else if (type === 'events') {
                entries = bdayService.getEvents();
                title = '📅 Events';
                color = 0x5865F2;

                // Server Anniversary hinzufügen, falls definiert
                if (data.server && data.server.day && data.server.month) {
                    entries.push({
                        id: data.server.id || 'server_anniversary',
                        name: 'Server Anniversary',
                        day: data.server.day,
                        month: data.server.month,
                        recurring: data.server.recurring || true
                    });
                }
            }

            if (entries.length === 0) {
                return interaction.reply({
                    content: `❌ No ${type === 'bdays' ? 'birthdays' : 'events'} found.`,
                    flags: 64
                });
            }

            // sortiere nach Monat und Tag
            entries.sort((a, b) => a.month - b.month || a.day - b.day);

            const grouped = {};

            // Fetch alle Mitglieder einmal (nur für Geburtstage nötig)
            let membersCache = {};
            if (type === 'bdays') {
                const members = await interaction.guild.members.fetch();
                membersCache = members.reduce((acc, member) => {
                    acc[member.id] = member;
                    return acc;
                }, {});
            }

            for (const e of entries) {
                const month = monthNames[e.month - 1];
                if (!grouped[month]) grouped[month] = [];

                let name;
                if (type === 'bdays') {
                    if (e.userId && membersCache[e.userId]) {
                        name = `<@${e.userId}>`; // saubere Erwähnung
                    } else if (e.name) {
                        name = e.name; // Fallback Name aus JSON
                    } else if (e.displayName) {
                        name = `${e.displayName} (left)`;
                    } else {
                        name = 'Unknown';
                    }
                } else {
                    name = e.name;
                }

                const line = `${name} • ${e.day.toString().padStart(2,'0')}. ${month}`;
                grouped[month].push(line);
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(color);

            for (const month of Object.keys(grouped)) {
                embed.addFields({ name: month, value: grouped[month].join('\n'), inline: false });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: '❌ Something went wrong.',
                flags: 64
            });
        }
    }
};