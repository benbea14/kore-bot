const { SlashCommandBuilder } = require('discord.js');
const { setXPPaused } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpstop')
    .setDescription('Stops XP gain globally (Creator only)'),

  async execute(interaction) {
    try {
      // Creator Only
      if (interaction.user.id !== process.env.USER_ID) {
        return interaction.reply({ 
          content: 'Only for the Bot Owner.', 
          flags: 64 
        });
      }

      setXPPaused(true);

      return interaction.reply({
        content: '⏸️ XP was globally paused.',
        flags: 64
      });
    } catch (error) {
      console.error('Error in /xpstop:', error);
      return interaction.reply({
        content: '⚠️ Error while pausing XP.',
        flags: 64
      });
    }
  }
};