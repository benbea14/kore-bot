const { EmbedBuilder } = require('discord.js');
const bdayService = require('./bdayService');

// PLACEHOLDER SYSTEM
function formatTemplate(template, data) {
    return template
        .replace(/{name}/g, data.name ?? "")
        .replace(/{age}/g, data.age ?? "")
        .replace(/{type}/g, data.type ?? "")
        .replace(/{server}/g, data.server ?? "");
}

// RANDOM IMAGE
function getRandomImage(images) {
    if (!images || images.length === 0) return null;
    return images[Math.floor(Math.random() * images.length)];
}

// SEND BIRTHDAY
async function sendBirthdayMessage(client, entry, previewChannel = null) {

    const data = bdayService.loadData();
    const channelId = process.env.BDAY_CHANNEL_ID;
    if (!channelId && !previewChannel) return;

    const channel = previewChannel || client.channels.cache.get(channelId);
    if (!channel) return;

    const template = data.messages?.birthday?.template;
    const useEmbed = data.messages?.birthday?.useEmbed ?? true;

    if (!template) {
        console.warn('Birthday template not configured');
        return;
    }

    const name = entry.type === "user"
        ? `<@${entry.userId}>`
        : entry.name;

    const age = bdayService.calculateAge(entry) ?? "";

    const messageContent = formatTemplate(template, {
        name,
        age,
        type: "birthday",
        server: client.guilds.cache.first()?.name ?? ""
    });

    const randomImage = getRandomImage(entry.images);

    if (useEmbed) {

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(messageContent);

        if (randomImage) embed.setImage(randomImage);

        await channel.send({ embeds: [embed] });

    } else {

        await channel.send({
            content: messageContent,
            files: randomImage ? [randomImage] : []
        });
    }
}

// SEND EVENT
async function sendEventMessage(client, event, previewChannel = null) {

    const data = bdayService.loadData();
    const channelId = process.env.BDAY_CHANNEL_ID;
    if (!channelId && !previewChannel) return;

    const channel = previewChannel || client.channels.cache.get(channelId);
    if (!channel) return;

    const template = data.messages?.event?.template;
    const useEmbed = data.messages?.event?.useEmbed ?? true;

    if (!template) {
        console.warn('Event template not configured');
        return;
    }

    const messageContent = formatTemplate(template, {
        name: event.name,
        age: "",
        type: "event",
        server: client.guilds.cache.first()?.name ?? ""
    });

    const randomImage = getRandomImage(event.images);

    if (useEmbed) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(messageContent);

        if (randomImage) embed.setImage(randomImage);

        await channel.send({ embeds: [embed] });

    } else {

        await channel.send({
            content: messageContent,
            files: randomImage ? [randomImage] : []
        });
    }
}

module.exports = {
    sendBirthdayMessage,
    sendEventMessage
};