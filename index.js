const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const LOG_WINDOW_MS = Number(process.env.LOG_WINDOW_MS ?? 60_000);
const LOG_MAX_PER_KEY = Number(process.env.LOG_MAX_PER_KEY ?? 10);
const LOG_SUMMARY_EVERY_MS = Number(process.env.LOG_SUMMARY_EVERY_MS ?? 15_000);
const XP_DELETE_ON_LEAVE = process.env.XP_DELETE_ON_LEAVE === 'true';
const XP_LOG_MEMBER_LEAVE = process.env.XP_LOG_MEMBER_LEAVE === 'true';
const LOG_SUPPRESS_LARGE_OBJECTS = process.env.LOG_SUPPRESS_LARGE_OBJECTS !== 'false';
const LARGE_OBJECT_KEY_LIMIT = Number(process.env.LARGE_OBJECT_KEY_LIMIT ?? 20);
const LOG_INCLUDE_CALLSITE = process.env.LOG_INCLUDE_CALLSITE !== 'false';

const originalConsoleError = console.error.bind(console);
const originalConsoleLog = console.log.bind(console);
const errorRateState = new Map();

function isLargePlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }

  return Object.keys(value).length >= LARGE_OBJECT_KEY_LIMIT;
}

function getLogCallsite() {
  if (!LOG_INCLUDE_CALLSITE) {
    return null;
  }

  const stack = new Error().stack;
  if (!stack) {
    return null;
  }

  const lines = stack.split('\n').map(line => line.trim());
  const appLine = lines.find(line =>
    line.includes('Kora') &&
    !line.includes('sanitizeLogArg') &&
    !line.includes('sanitizeLogArgs') &&
    !line.includes('sanitizedConsoleLog') &&
    !line.includes('rateLimitedConsoleError')
  );

  return appLine ?? null;
}

function sanitizeLogArg(arg) {
  if (!LOG_SUPPRESS_LARGE_OBJECTS || !isLargePlainObject(arg)) {
    return arg;
  }

  const keys = Object.keys(arg);
  const preview = keys.slice(0, 5).join(', ');
  const callsite = getLogCallsite();
  const sourcePart = callsite ? `, source: ${callsite}` : '';
  return `[log-sanitizer] Large object suppressed (${keys.length} keys, preview: ${preview}${keys.length > 5 ? ', ...' : ''}${sourcePart})`;
}

function sanitizeLogArgs(args) {
  return args.map(sanitizeLogArg);
}

function sanitizedConsoleLog(...args) {
  const sanitizedArgs = sanitizeLogArgs(args);
  originalConsoleLog(...sanitizedArgs);
}

function getErrorLogKey(args) {
  const first = args[0];

  if (typeof first === 'string' && first.trim()) {
    return first;
  }

  if (first && typeof first === 'object' && typeof first.message === 'string') {
    return first.message;
  }

  return '__generic_error__';
}

function rateLimitedConsoleError(...args) {
  const sanitizedArgs = sanitizeLogArgs(args);
  const now = Date.now();
  const key = getErrorLogKey(sanitizedArgs);
  const state = errorRateState.get(key);

  if (!state || now - state.windowStart >= LOG_WINDOW_MS) {
    if (state?.suppressed > 0) {
      originalConsoleError(`[log-throttle] Suppressed ${state.suppressed} repeated errors for key: ${key}`);
    }

    errorRateState.set(key, {
      windowStart: now,
      emitted: 1,
      suppressed: 0,
      lastSummaryAt: now
    });

    originalConsoleError(...sanitizedArgs);
    return;
  }

  if (state.emitted < LOG_MAX_PER_KEY) {
    state.emitted += 1;
    originalConsoleError(...sanitizedArgs);
    return;
  }

  state.suppressed += 1;
  if (now - state.lastSummaryAt >= LOG_SUMMARY_EVERY_MS) {
    state.lastSummaryAt = now;
    originalConsoleError(`[log-throttle] Suppressed ${state.suppressed} repeated errors for key: ${key}`);
  }
}

console.log = sanitizedConsoleLog;
console.error = rateLimitedConsoleError;

const countingGame = require('./game/CountingGame');
const { handleMessage, updateNickname, getLevelData, resetUser, hasStoredUser } = require('./XP/leveling');
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

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`[shutdown] Received ${signal}, closing bot...`);

  try {
    await new Promise(resolve => keepAliveServer.close(resolve));
  } catch (error) {
    console.error('[shutdown] HTTP server close failed:', error);
  }

  try {
    await client.destroy();
  } catch (error) {
    console.error('[shutdown] Discord client destroy failed:', error);
  }

  process.exit(0);
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

const LEGACY_ROLE_BUTTONS = {
  accept_rules: process.env.RULES_ROLE_ID,
  role_rm: '🐨 RM',
  role_jin: '🐹 Jin',
  role_suga: '🐱 Suga',
  role_jhope: '🐿 J-Hope',
  role_jimin: '🐥 Jimin',
  role_v: '🐻 V',
  role_jk: '🐰 JK'
};

function getRoleFromButton(interaction) {
  const { customId, guild } = interaction;

  if (customId.startsWith('announce_role:')) {
    const roleId = customId.slice('announce_role:'.length);
    return guild.roles.cache.get(roleId) ?? null;
  }

  if (customId === 'accept_rules') {
    return guild.roles.cache.get(LEGACY_ROLE_BUTTONS.accept_rules) ?? null;
  }

  const roleName = LEGACY_ROLE_BUTTONS[customId];
  if (!roleName) {
    return null;
  }

  return guild.roles.cache.find(role => role.name === roleName) ?? null;
}

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
    const role = getRoleFromButton(interaction);
    if (!role) {
      return;
    }

    if (!role.editable) {
      return interaction.reply({
        content: `⚠️ I cannot manage the "${role.name}" role due to role hierarchy or missing permissions.`,
        flags: 64,
      });
    }

    const memberHasRole = interaction.member.roles.cache.has(role.id);

    try {
      if (memberHasRole) {
        await interaction.member.roles.remove(role);
      } else {
        await interaction.member.roles.add(role);
      }
    } catch (error) {
      console.error(`Role toggle error (${interaction.customId}):`, error);
      return interaction.reply({
        content: `⚠️ I could not update the "${role.name}" role. Please contact staff.`,
        flags: 64,
      });
    }

    return interaction.reply({
      content: memberHasRole
        ? `✅ The "${role.name}" role was removed.`
        : `💜 You now have the "${role.name}" role!`,
      flags: 64,
    });
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

client.on(Events.GuildMemberRemove, member => {
  try {
    const hadXPData = hasStoredUser(member.id);

    if (!hadXPData) {
      return;
    }

    if (XP_DELETE_ON_LEAVE) {
      resetUser(member.id);
      if (XP_LOG_MEMBER_LEAVE) {
        console.log(`[XP] Member left, XP data deleted for ${member.user?.tag || member.id} (${member.id}).`);
      }
      return;
    }

    if (XP_LOG_MEMBER_LEAVE) {
      console.log(`[XP] Member left, XP data kept for ${member.user?.tag || member.id} (${member.id}).`);
    }
  } catch (error) {
    console.error('GuildMemberRemove XP handling error:', error);
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