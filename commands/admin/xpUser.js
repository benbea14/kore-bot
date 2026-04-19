const { SlashCommandBuilder } = require('discord.js');
const { setUserExcluded, isUserExcluded, resetUser } = require('../../XP/leveling');

function getCleanDisplayName(member) {
  const withoutPrestigePrefix = member.displayName
    .replace(/^[✪✦]+\s*\|\s*/, '')
    .trim();

  return withoutPrestigePrefix.split('|')[0].trim();
}

async function cleanNickname(member) {
  if (!member || !member.manageable) return false;

  const cleanName = getCleanDisplayName(member);
  if (!cleanName) return false;

  try {
    await member.setNickname(cleanName);
    return true;
  } catch (error) {
    console.warn(`Couldn't clean nickname for ${member.user?.tag || 'unknown'}: ${error.message}`);
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpuser')
    .setDescription('Manage XP system for a specific user (Creator only)')
    .addSubcommand(sub =>
      sub
        .setName('stop')
        .setDescription('Exclude a user from XP gain and leaderboard')
        .addUserOption(opt =>
          opt.setName('user').setDescription('User to exclude').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('start')
        .setDescription('Include a user again in the XP system')
        .addUserOption(opt =>
          opt.setName('user').setDescription('User to include').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('Reset XP data for a specific user')
        .addUserOption(opt =>
          opt.setName('user').setDescription('User to reset').setRequired(true)
        )
    ),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.USER_ID) {
        return interaction.reply({
          content: 'Only for the Bot Owner.',
          flags: 64
        });
      }

      const subcommand = interaction.options.getSubcommand();
      const user = interaction.options.getUser('user');
      const member = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id).catch(() => null);

      if (subcommand === 'stop') {
        resetUser(user.id);
        setUserExcluded(user.id, true);

        const nicknameCleaned = await cleanNickname(member);

        return interaction.reply({
          content: `⏸️ <@${user.id}> was excluded from XP gain and removed from rankings.${nicknameCleaned ? ' Nickname cleaned.' : ''}`,
        });
      }

      if (subcommand === 'start') {
        setUserExcluded(user.id, false);

        return interaction.reply({
          content: `▶️ <@${user.id}> can earn XP again and will appear in rankings once they gain XP.`,
        });
      }

      if (subcommand === 'reset') {
        const wasExcluded = isUserExcluded(user.id);
        resetUser(user.id);

        if (wasExcluded) {
          setUserExcluded(user.id, true);
        }

        const nicknameCleaned = await cleanNickname(member);

        return interaction.reply({
          content: `🧹 XP data for <@${user.id}> was reset to zero.${wasExcluded ? ' Exclusion was kept.' : ''}${nicknameCleaned ? ' Nickname cleaned.' : ''}`,
        });
      }

      return interaction.reply({
        content: '⚠️ Unknown subcommand.',
        flags: 64
      });
    } catch (error) {
      console.error('Error in /xpuser:', error);

      if (!interaction.replied) {
        return interaction.reply({
          content: '⚠️ Error while managing user XP settings.',
          flags: 64
        });
      }

      return interaction.editReply('⚠️ Error while managing user XP settings.');
    }
  }
};
