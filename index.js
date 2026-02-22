const express = require('express');
const app = express();
const fs = require('node:fs');
const path = require('node:path');
const countingGame = require('./game/CountingGame');

const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  Partials,
  EmbedBuilder,
  AttachmentBuilder
} = require('discord.js');

require('dotenv').config();
const token = process.env.TOKEN;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

app.get('/', (req, res) => res.send('Bot is alive'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌱 Keep-alive server listening on port ${PORT}`));

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '⚠️ An error occurred while executing this command.',
        ephemeral: true,
      });
    }
  }

  // Accept Rules
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId === 'accept_rules') {
      const role = interaction.guild.roles.cache.find(r => r.name === 'ARMY');

      if (!role) {
        return interaction.reply({
          content: '⚠️ The "ARMY" role was not found.',
          ephemeral: true,
        });
      }

      await interaction.member.roles.add(role);

      return interaction.reply({
        content: '✅ You received the ARMY role.',
        ephemeral: true,
      });
    }

    // Bias Roles
    const biasRoles = {
      role_rm: '🐨 RM',
      role_jin: '🐹 Jin',
      role_suga: '🐱 Suga',
      role_jhope: '🐿 J-Hope',
      role_jimin: '🐥 Jimin',
      role_v: '🐻 V',
      role_jk: '🐰 JK'
    };

    if (customId in biasRoles) {
      const roleName = biasRoles[customId];
      const role = interaction.guild.roles.cache.find(r => r.name === roleName);

      if (!role) {
        return interaction.reply({
          content: `⚠️ Role "${roleName}" not found.`,
          ephemeral: true,
        });
      }

      await interaction.member.roles.add(role);

      return interaction.reply({
        content: `💜 You now have ${roleName}!`,
        ephemeral: true,
      });
    }
  }
});

// Welcome message
client.on(Events.GuildMemberAdd, async member => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  // Attachment vorbereiten
  const attachment = new AttachmentBuilder(path.join(__dirname, 'welcome.png'));

  // Embed erstellen
  const welcomeEmbed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(`🎉 Welcome to ${member.guild.name}!`)
    .setDescription(`Hello <@${member.id}>!`)
    .setImage('attachment://welcome.png') // <-- wichtig, zwei Punkte : und exakt "attachment://Dateiname"
    .setFooter({ text: 'Please read the rules 💜' })
    .setTimestamp();

  // Nachricht senden
  await channel.send({ embeds: [welcomeEmbed], files: [attachment] });

  // DM senden (optional)
  try {
    await member.send({ embeds: [welcomeEmbed], files: [attachment] });
  } catch {
    console.log(`Could not DM ${member.user.tag}`);
  }
});

// leveling System
const { handleMessage, updateNickname, getLevelData } = require('./XP/leveling');

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const result = await handleMessage(message);
  if (!result) return;

  if (result.leveledUp) {
    const levelInfo = getLevelData(result.level);

    // Fortschrittsbalken
    const nextLevelXP = result.level * 100; // passt zu deinem LEVEL_MULTIPLIER
    const progress = Math.min(Math.round((result.xp / nextLevelXP) * 10), 10);
    const progressBar = '▰'.repeat(progress) + '▱'.repeat(10 - progress);

    // Fancy Level-Up Embed
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🎉 LEVEL UP! 🎉')
      .setDescription(`GG <@${result.userId}>! You leveled up! 💜`)
      .addFields(
        { name: 'Level', value: `Lv **${result.level}**`, inline: true },
        { name: 'Title', value: `${levelInfo.emoji} **${levelInfo.title}**`, inline: true },
        { name: 'Progress', value: `${progressBar} ${result.xp}/${nextLevelXP} XP`, inline: false },
        { name: '\u200b', value: '🎉✨ Keep chatting to reach the next level! 💜', inline: false }
      )
      .setFooter({ text: 'Auto XP System • Chat to grow' })
      .setTimestamp();

    // Nachricht im Channel
    message.channel.send({ embeds: [embed] });

    // Automatischer Nickname Update
    if (message.member) {
      await updateNickname(message.member, result.level);
    }

    // DM optional
    try {
      await message.author.send({ embeds: [embed] });
    } catch {}
  }

  await countingGame(message);
});




client.login(token);