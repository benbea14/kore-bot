const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('importxp')
    .setDescription('Importiert XP Daten ins neue Volume (Owner only)')
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('Die exportierte JSON Datei')
        .setRequired(true)
    ),

  async execute(interaction) {

    if (interaction.user.id !== '469933093537447980') {
      return interaction.reply({
        content: 'Nur für den Bot Owner.',
        flags: 64
      });
    }

    const attachment = interaction.options.getAttachment('file');

    try {
      const response = await fetch(attachment.url);
      const text = await response.text();

      // 🧠 JSON Validierung
      JSON.parse(text);

      const dataDir = '/data';
      const newPath = `${dataDir}/xp.json`;

      // 🔐 Falls schon Datei existiert → Backup erstellen
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(newPath, text);

      await interaction.reply({
        content: 'XP Daten erfolgreich ins neue Volume importiert.',
        flags: 64
      });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Fehler beim Import – JSON eventuell ungültig.',
        flags: 64
      });
    }
  }
};