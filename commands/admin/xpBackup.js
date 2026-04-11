const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

const mainPath = '/data/xp.json';

const backupPaths = [
  '/data/xp_backup_1.json',
  '/data/xp_backup_2.json',
  '/data/xp_backup_3.json'
];

function createBackup() {
  try {
    // Rotate older backups
    for (let i = backupPaths.length - 1; i > 0; i--) {
      if (fs.existsSync(backupPaths[i - 1])) {
        fs.copyFileSync(backupPaths[i - 1], backupPaths[i]);
      }
    }

    // Create new backup
    if (fs.existsSync(mainPath)) {
      fs.copyFileSync(mainPath, backupPaths[0]);
    }

    console.log("Backup created (rotating)");
  } catch (err) {
    console.error("Backup error:", err);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpbackup')
    .setDescription('Creates a backup of all XP data (Creator only)'),

  async execute(interaction) {
    try {
      // Creator Only
      if (interaction.user.id !== process.env.USER_ID) {
        return interaction.reply({ 
          content: 'Only for the Bot Owner.', 
          flags: 64 
        });
      }

      const data = fs.readFileSync(mainPath);

      const backup = new AttachmentBuilder(data, {
        name: `xp-backup-${new Date().toISOString()}.json`
      });

      return interaction.reply({
        content: '📦 XP Backup created:',
        files: [backup],
      });

    } catch (err) {
      console.error('Error in /xpbackup:', err);

      return interaction.reply({
        content: '❌ Backup failed.',
        flags: 64
      });
    }
  },

  createBackup
};