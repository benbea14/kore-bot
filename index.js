const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const countingGame = require('./game/CountingGame');
const { handleMessage, updateNickname, getLevelData } = require('./XP/leveling');
const { createBackup } = require('./commands/admin/xpBackup');
const { startScheduler } = require('./bday/bdayScheduler');
const { startDailyScheduler } = require('./daily/dailyScheduler');
const { handleMessageTrigger } = require('./triggers/triggerHandler');

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

client.commands = new Collection();

const keepAliveServer = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bot is alive');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

const PORT = process.env.PORT || 3000;
keepAliveServer.listen(PORT, () => console.log(`🌱 Keep-alive server listening on port ${PORT}`));

// ================= COMMAND HANDLER =================

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

// ================= READY =================

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Create backup on startup
  createBackup();

  startScheduler(client);
  startDailyScheduler(client);
});

// ================= INTERACTIONS =================

client.on(Events.InteractionCreate, async interaction => {

  // ===== SLASH COMMANDS =====
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '⚠️ Command failed, contact technical admin',
          flags: 64
        });
      } else {
        await interaction.reply({
          content: '⚠️ Command failed, contact technical admin',
          flags: 64
        });
      }
    }
  }

  // ===== BUTTONS =====
  if (interaction.isButton()) {
    const customId = interaction.customId;

    // Accept Rules Button
    if (customId === 'accept_rules') {
      const role = interaction.guild.roles.cache.get(process.env.RULES_ROLE_ID);

      if (!role) {
        return interaction.reply({
          content: '⚠️ The "ARMY" role was not found.',
          flags: 64,
        });
      }

      if (!role.editable) {
        return interaction.reply({
          content: '⚠️ I cannot assign the ARMY role due to role hierarchy/permissions.',
          flags: 64,
        });
      }

      try {
        await interaction.member.roles.add(role);
      } catch (error) {
        console.error('Role assignment error (accept_rules):', error);
        return interaction.reply({
          content: '⚠️ I could not assign the ARMY role. Please contact staff.',
          flags: 64,
        });
      }

      return interaction.reply({
        content: '✅ You received the ARMY role.',
        flags: 64,
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
          flags: 64,
        });
      }

      if (!role.editable) {
        return interaction.reply({
          content: `⚠️ I cannot assign "${roleName}" due to role hierarchy/permissions.`,
          flags: 64,
        });
      }

      try {
        await interaction.member.roles.add(role);
      } catch (error) {
        console.error(`Role assignment error (${roleName}):`, error);
        return interaction.reply({
          content: `⚠️ I could not assign ${roleName}. Please contact staff.`,
          flags: 64,
        });
      }

      return interaction.reply({
        content: `💜 You now have ${roleName}!`,
        flags: 64,
      });
    }
  }
});

// ================= WELCOME MESSAGE =================

client.on(Events.GuildMemberAdd, async member => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const welcomeImage = path.join(__dirname, 'welcome.png');
  const RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID;

  const welcomeEmbed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(`🎉 Welcome to ${member.guild.name}!`)
    .setDescription(
      `Hey ${member}! Welcome to our server! 💜\n
      Make sure to agree to our <#${RULES_CHANNEL_ID}> to get the ARMY role!
      With that you can join the VC and write in all the chats!`
    )
    .setImage('attachment://welcome.png')
    .setFooter({ text: 'Enjoy your stay 💜' })
    .setTimestamp();

  await channel.send({
    embeds: [welcomeEmbed],
    files: [new AttachmentBuilder(welcomeImage)]
  });

      // ===== PRIVATE MESSAGE =====
  const dmEmbed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(`💜 Welcome to ${member.guild.name}!`)
    .setDescription(
      `Hi ${member}! 🫶\n
      We’re really happy you joined our BTS community!\n
      To start chatting:\n
      1️⃣ Read the rules \n
      2️⃣ Click the **I agree** button \n
      3️⃣ Get the **ARMY role**! \n
      Then you can access all chats and join voice channels!\n Borahae 💜`)
    .setImage('attachment://welcome.png')
    .setFooter({ text: 'Have fun and enjoy the server!' });

  try {
    await member.send({
      embeds: [dmEmbed],
      files: [new AttachmentBuilder(welcomeImage)] });
  } catch {
    console.log(`Could not DM ${member.user.tag}`);
  }
});

// ================= MESSAGE EVENTS =================

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  const LEVEL_MULTIPLIER = 100; // optional später exportieren

  // ===== XP SYSTEM =====
  const result = await handleMessage(message);

  if (result && result.leveledUp) {
    const levelInfo = getLevelData(result.level, result.prestige);

    const nextLevelXP = result.level * LEVEL_MULTIPLIER;
    const xpNeeded = nextLevelXP - result.xp;

    // 💜 gleiche Progress-Logik wie bei /rank
    const totalBars = 20;
    const progressRatio = Math.min(result.xp / nextLevelXP, 1);
    const filledBars = Math.floor(progressRatio * totalBars);
    const emptyBars = totalBars - filledBars;
    const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(emptyBars);

    const displayName =
      message.member?.nickname || message.author.username;

    const fields = [
      { name: 'Level', value: `Lv **${result.level}**`, inline: true },
      { name: 'Title', value: `${levelInfo.emoji} **${result.title}**`, inline: true },
    ];

    // Show custom title as additional field if it exists
    if (result.customTitle) {
      fields.push({
        name: 'Special Title',
        value: `**${result.customTitle}**`,
        inline: true
      });
    }

    fields.push(
      {
        name: 'Progress',
        value: `${result.xp}/${nextLevelXP} XP (${xpNeeded} XP until next level)\n${progressBar}`,
        inline: false
      },
      {
        name: '\u200b',
        value: '✨ Keep chatting to reach the next level! 💜',
        inline: false
      }
    );

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`🎉 LEVEL UP! 🎉`)
      .setDescription(`Congrats ${displayName}!! You leveled up! 💜`)
      .addFields(fields)
      .setFooter({ text: 'Auto XP System' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    if (result.prestigeUp) {
      const bigStars = Math.floor(result.prestige / 5);
      const smallStars = result.prestige % 5;

      const stars = "✪".repeat(bigStars) + "✦".repeat(smallStars);

      const prestigeEmbed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(`🌌 PRESTIGE UNLOCKED 🌌`)
        .setDescription(`💜 **${displayName}** reached Prestige ${stars}!`)
        .setFooter({ text: 'The journey begins again… stronger than ever.' });

      await message.channel.send({ embeds: [prestigeEmbed] });
    }

    // Nickname Update (eigentlich macht das schon handleMessage, aber safe ist safe)
    if (message.member) {
      await updateNickname(message.member, result.level);
    }

    // Optional DM
    try {
      await message.author.send({ embeds: [embed] });
    } catch {}
  }

  // ===== COUNTING GAME =====
  try {
    await countingGame(message);
  } catch (err) {
    console.error("CountingGame Error:", err);
  }

  // ===== TRIGGER SYSTEM =====
  try {
    await handleMessageTrigger(client, message);
  } catch (err) {
    console.error("Trigger Error:", err);
  }

});

client.login(token);