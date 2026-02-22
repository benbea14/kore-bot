const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Sends the server rules with the agree button.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // <-- Staff-Only

  async execute(interaction) {

    const rulesEmbed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('Welcome to Purple Hours 💜')
      .setDescription('A cozy, safe space for everyone to relax, laugh and share love for BTS together!')

      .addFields(
        { name: '1️⃣ Be kind & respectful', value: 'We’re here to have fun and feel safe. No hate, drama or disrespect.' },
        { name: '2️⃣ Keep it cozy', value: 'No spam or flooding chats. Be mindful so everyone feels comfy.' },
        { name: '3️⃣ Respect privacy', value: 'Don’t share personal info or private conversations.' },
        { name: '4️⃣ Safe for everyone', value: 'No NSFW, offensive jokes or heavy topics. This is a calm soft space.' },
        { name: '5️⃣ English preferred', value: 'To help everyone feel included, please keep main chats mostly in English.' },
        { name: '6️⃣ During watch parties', value: 'Mute if you’re not talking and keep the vibes relaxed & have fun 🍿' },
        {
          name: '🧐 If you’re new to Discord:',
          value:
            'Introduce yourself in <#1438183397338910731>\n' +
            'Chat with everyone in <#1437205534712529046>\n' +
            'Check <#1437207663548174488> for events\n' +
            'Join the <#1437800765770039477> during streams or just to talk 💜'
        }
      )
      .setFooter({ text: 'Click the button below to receive the ARMY role 💜' })
      .setTimestamp();

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_rules')
        .setLabel('💜 I agree')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [rulesEmbed],
      components: [button],
    });
  }
};
