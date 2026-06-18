const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

function getSelectedRoles(interaction) {
  const selectedRoles = [];

  for (let index = 1; index <= 10; index += 1) {
    const role = interaction.options.getRole(`role${index}`);
    if (role) {
      selectedRoles.push(role);
    }
  }

  const uniqueRoles = [];
  const seenRoleIds = new Set();

  for (const role of selectedRoles) {
    if (seenRoleIds.has(role.id)) {
      continue;
    }

    seenRoleIds.add(role.id);
    uniqueRoles.push(role);
  }

  return uniqueRoles;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows statistics for selected roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(option =>
      option
        .setName('role1')
        .setDescription('First role to include')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('role2')
        .setDescription('Second role to include')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role3')
        .setDescription('Third role to include')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role4')
        .setDescription('Fourth role to include')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role5')
        .setDescription('Fifth role to include')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role6')
        .setDescription('Sixth role to include')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role7')
        .setDescription('Seventh role to include')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role8')
        .setDescription('Eighth role to include')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role9')
        .setDescription('Ninth role to include')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('role10')
        .setDescription('Tenth role to include')
        .setRequired(false)
    ),

  async execute(interaction) {
    const selectedRoles = getSelectedRoles(interaction);

    if (!selectedRoles.length) {
      return interaction.reply({
        content: '⚠️ Please select at least one role.',
        flags: 64
      });
    }

    // Ensure member cache is populated so role member counts are accurate.
    await interaction.guild.members.fetch();

    let descriptionLines = [];
    let total = 0;

    for (const role of selectedRoles) {
      total += role.members.size;
    }

    for (const role of selectedRoles) {
      const count = role.members.size;
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      descriptionLines.push(`${role} — **${count}** (${percent}%)`);
    }

    const today = new Date().toLocaleDateString('de-DE');

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('📊 Role Statistics')
      .setDescription(descriptionLines.join('\n'))
      .addFields({
        name: 'Total Participants',
        value: `**${total}**`,
        inline: false
      })
      .addFields({
        name: 'Roles Included',
        value: `**${selectedRoles.length}**`,
        inline: true
      })
      .setFooter({ text: `Stand: ${today}` });

    await interaction.reply({
      embeds: [embed],
    });
  }
};
