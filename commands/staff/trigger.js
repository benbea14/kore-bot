const { SlashCommandBuilder } = require('discord.js');
const triggerService = require('../../triggers/triggerService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trigger')
    .setDescription('Manage message triggers (staff only)')
    .addSubcommand(sub =>
      sub.setName('on')
        .setDescription('Enable all triggers')
    )
    .addSubcommand(sub =>
      sub.setName('off')
        .setDescription('Disable all triggers')
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a trigger')
        .addStringOption(option =>
          option.setName('keywords')
            .setDescription('Comma-separated keywords')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Message category to trigger')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('chance')
            .setDescription('Chance in percent (0-100)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('gifs')
            .setDescription('Comma-separated GIF URLs (optional)')
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a trigger by index')
        .addIntegerOption(option =>
          option.setName('index')
            .setDescription('Index from /trigger list')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all triggers')
    ),

  async execute(interaction) {
    // nur Staff
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ content: '❌ You do not have permission.', flags: 64 });
    }

    const sub = interaction.options.getSubcommand();
    const data = triggerService.loadTriggers();

    if (sub === 'on') {
      data.enabled = true;
      triggerService.saveTriggers(data);
      return interaction.reply({ content: '✅ Triggers enabled', flags: 64 });
    }

    if (sub === 'off') {
      data.enabled = false;
      triggerService.saveTriggers(data);
      return interaction.reply({ content: '❌ Triggers disabled', flags: 64 });
    }

    if (sub === 'add') {
      const keywords = interaction.options.getString('keywords').split(',').map(k => k.trim().toLowerCase());
      const category = interaction.options.getString('category').toLowerCase();
      const chance = interaction.options.getInteger('chance');
      const gifsOption = interaction.options.getString('gifs') || '';
      const gif_urls = gifsOption.split(',').map(g => g.trim()).filter(Boolean);

      data.triggers.push({ keywords, category, chance, gif_urls });
      triggerService.saveTriggers(data);

      return interaction.reply({
        content: `💜 Trigger added:\nKeywords: [${keywords.join(', ')}]\nCategory: ${category}\nChance: ${chance}%\nGIFs: ${gif_urls.length ? gif_urls.join(', ') : 'none'}`,
        flags: 64
      });
    }

    if (sub === 'remove') {
      const index = interaction.options.getInteger('index') - 1;
      if (index < 0 || index >= data.triggers.length) {
        return interaction.reply({ content: '❌ Invalid index', flags: 64 });
      }
      const removed = data.triggers.splice(index, 1);
      triggerService.saveTriggers(data);
      return interaction.reply({
        content: `🗑 Trigger removed:\nKeywords: [${removed[0].keywords.join(', ')}]\nCategory: ${removed[0].category}`,
        flags: 64
      });
    }

    if (sub === 'list') {
      if (!data.triggers.length) return interaction.reply({ content: '❌ No triggers set', flags: 64 });
      const list = data.triggers.map((t, i) =>
        `${i+1}. [${t.keywords.join(', ')}] -> ${t.category} (${t.chance}%) ${t.gif_urls?.length ? '| GIFs: ' + t.gif_urls.join(', ') : ''}`
      ).join('\n');
      return interaction.reply({ content: `📜 **Triggers:**\n${list}`, flags: 64 });
    }
  }
};