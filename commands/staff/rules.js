const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Sends the server rules with the agree button.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // <-- Staff-Only

  async execute(interaction) {
    const INTRODUCTION = process.env.INTRODUCTION;
    const MAIN_CHAT = process.env.MAIN_CHAT;
    const UPDATES = process.env.UPDATES;
    const VC_CHANNEL = process.env.VC_CHANNEL;

    console.log('[rules] env check:', { INTRODUCTION: !!INTRODUCTION, MAIN_CHAT: !!MAIN_CHAT, UPDATES: !!UPDATES, VC_CHANNEL: !!VC_CHANNEL });

    // Acknowledge quickly so Discord does not expire the interaction token.
    await interaction.deferReply();

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
            `Introduce yourself in <#${INTRODUCTION}>\n` +
            `Chat with everyone in <#${MAIN_CHAT}>\n` +
            `Check <#${UPDATES}> for events\n` +
            `Join the <#${VC_CHANNEL}> during streams or just to talk 💜`
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

    await interaction.editReply({
      embeds: [rulesEmbed],
      components: [button],
    });
  }
};
