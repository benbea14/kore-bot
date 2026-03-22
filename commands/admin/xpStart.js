const { SlashCommandBuilder } = require('discord.js');
const { setXPPaused } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpstart')
    .setDescription('Resumes XP gain (Creator only)'),

  async execute(interaction) {

    if (interaction.user.id !== process.env.USER_ID) {
      return interaction.reply({ 
        content: 'Nur für den Bot Owner.', 
        flags: 64 
      });
    }

    setXPPaused(false);

    return interaction.reply({
      content: '▶️ XP wurde wieder aktiviert.',
      flags: 64
    });
  }
};