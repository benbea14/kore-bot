const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { reloadXPDataFromDisk } = require('../../XP/leveling');

const mainPath = '/data/xp.json';

const backupPaths = [
  '/data/xp_backup_1.json',
  '/data/xp_backup_2.json',
  '/data/xp_backup_3.json'
];

function getBackupInfo() {
  const backups = [];
  
  for (let i = 0; i < backupPaths.length; i++) {
    if (fs.existsSync(backupPaths[i])) {
      const stats = fs.statSync(backupPaths[i]);
      const data = JSON.parse(fs.readFileSync(backupPaths[i], 'utf8'));
      const userCount = Object.keys(data).length;
      
      backups.push({
        index: i + 1,
        path: backupPaths[i],
        date: stats.mtime,
        userCount: userCount,
        size: stats.size
      });
    }
  }
  
  return backups;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xprestore')
    .setDescription('Restore XP data from backups (Creator only)')
    .addSubcommand(sub => 
      sub.setName('list')
         .setDescription('List available backups')
    )
    .addSubcommand(sub =>
      sub.setName('restore')
         .setDescription('Restore from a backup')
         .addIntegerOption(opt =>
           opt.setName('backup')
              .setDescription('Backup number (1=most recent, 2=older, 3=oldest)')
              .setRequired(true)
              .setMinValue(1)
              .setMaxValue(3)
         )
    ),

  async execute(interaction) {
    // Creator Only
    if (interaction.user.id !== process.env.USER_ID) {
      return interaction.reply({ 
        content: 'Only for the Bot Owner.', 
        flags: 64 
      });
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      // LIST BACKUPS
      if (subcommand === 'list') {
        const backups = getBackupInfo();

        if (backups.length === 0) {
          return interaction.reply({
            content: '❌ No backups found.',
            flags: 64
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('📦 Available XP Backups')
          .setColor(0x9B59B6)
          .setTimestamp();

        backups.forEach(backup => {
          const dateStr = backup.date.toLocaleString();
          embed.addFields({
            name: `Backup #${backup.index}`,
            value: `📅 ${dateStr}\n👥 Users: ${backup.userCount}\n💾 Size: ${(backup.size / 1024).toFixed(2)} KB`,
            inline: false
          });
        });

        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      // RESTORE FROM BACKUP
      if (subcommand === 'restore') {
        const backupNum = interaction.options.getInteger('backup');
        const backupPath = backupPaths[backupNum - 1];

        if (!fs.existsSync(backupPath)) {
          return interaction.reply({
            content: `❌ Backup #${backupNum} not found.`,
            flags: 64
          });
        }

        try {
          // Create emergency backup of current data before restoring
          if (fs.existsSync(mainPath)) {
            fs.copyFileSync(mainPath, '/data/xp_emergency_backup.json');
            console.log('Emergency backup created before restore');
          }

          // Restore from backup
          const backupData = fs.readFileSync(backupPath, 'utf8');
          fs.writeFileSync(mainPath, backupData);

          const data = JSON.parse(backupData);
          const userCount = Object.keys(data).length;

          const reloaded = reloadXPDataFromDisk();
          if (!reloaded) {
            return interaction.reply({
              content: '⚠️ Backup file restored but failed to refresh XP runtime cache. Please restart the bot.',
              flags: 64
            });
          }

          return interaction.reply({
            content: `✅ Restored from backup #${backupNum}\n👥 Users restored: ${userCount}\n💾 Emergency backup saved to xp_emergency_backup.json`,
            flags: 64
          });

        } catch (err) {
          console.error('Restore error:', err);
          return interaction.reply({
            content: '❌ Restore failed. Emergency backup is still available.',
            flags: 64
          });
        }
      }

    } catch (err) {
      console.error('Error in /xprestore:', err);
      return interaction.reply({
        content: '❌ Command failed.',
        flags: 64
      });
    }
  }
};
