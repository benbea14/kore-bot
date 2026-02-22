const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Pfade zu den Command-Ordnern
const commandFolders = {
  open: path.join(__dirname, 'commands', 'general'),
  staff: path.join(__dirname, 'commands', 'staff')
};

// Hilfsfunktion: Commands aus Ordner laden
function loadCommands(folderPath) {
  const commands = [];
  if (!fs.existsSync(folderPath)) return commands;

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const command = require(path.join(folderPath, file));
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠️ ${file} missing data or execute`);
    }
  }
  return commands;
}

// Commands sammeln
const openCommands = loadCommands(commandFolders.open);
const staffCommands = loadCommands(commandFolders.staff);

// Commands kombinieren
const allCommands = [...openCommands, ...staffCommands];

(async () => {
  try {
    console.log('🔄 Deploying all commands…');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: allCommands }
    );

    console.log(`✅ ${allCommands.length} commands deployed`);
  } catch (error) {
    console.error('❌ Deploy error:', error);
  }
})();


