const { SlashCommandBuilder } = require('discord.js');
const { setXPPaused } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpstop')
    .setDescription('Stops XP gain globally (Creator only)'),

  async execute(interaction) {

    if (interaction.user.id !== process.env.USER_ID) {
      return interaction.reply({ 
        content: 'Nur für den Bot Owner.', 
        flags: 64 
      });
    }

    setXPPaused(true);

    return interaction.reply({
      content: '⏸️ XP wurde pausiert.',
      flags: 64
    });
  }
};