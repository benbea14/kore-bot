const { SlashCommandBuilder } = require('discord.js');
const { setXPPaused } = require('../../XP/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpstart')
    .setDescription('Resumes XP gain (Creator only)'),

  async execute(interaction) {
    try {
      // Creator Only
      if (interaction.user.id !== process.env.USER_ID) {
        return interaction.reply({ 
          content: 'Only for the Bot Owner.', 
          flags: 64 
        });
      }

      setXPPaused(false);

      return interaction.reply({
        content: '▶️ XP was resumed.',
        flags: 64
      });
    } catch (error) {
      console.error('Error in /xpstart:', error);
      return interaction.reply({
        content: '⚠️ Error while resuming XP.',
        flags: 64
      });
    }
  }
};