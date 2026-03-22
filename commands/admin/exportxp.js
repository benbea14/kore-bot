const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

console.log("Root files:", fs.readdirSync('/XP'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('exportxp')
    .setDescription('Exportiert die XP Daten (Owner only)'),

  async execute(interaction) {

    if (interaction.user.id !== process.env.USER_ID) {
      return interaction.reply({ 
        content: 'Nur für den Bot Owner.', 
        flags: 64 
      });
    }

    try {
      const dataPath = '/XP/data.json';

      if (!fs.existsSync(dataPath)) {
        return interaction.reply({ 
          content: 'Datei nicht gefunden.', 
          flags: 64 
        });
      }

      const attachment = new AttachmentBuilder(dataPath);

      await interaction.reply({
        content: 'Hier ist dein XP Backup:',
        files: [attachment],
        flags: 64
      });

    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: 'Fehler beim Export.', 
        flags: 64 
      });
    }
  }
};
