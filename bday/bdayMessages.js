const { EmbedBuilder } = require('discord.js');
const bdayService = require('./bdayService');

// PLACEHOLDER SYSTEM
function formatTemplate(template, data) {
    return template
        .replace(/{name}/g, data.name ?? "")
        .replace(/{user}/g, data.user ?? "")
        .replace(/{age}/g, data.age ?? "")
        .replace(/{type}/g, data.type ?? "")
        .replace(/{server}/g, data.server ?? "");
}

// RANDOM IMAGE
function getRandomImage(images) {
    if (!Array.isArray(images)) return null;

    const validImages = images
        .filter(image => typeof image === 'string')
        .map(image => image.trim())
        .filter(Boolean);

    if (validImages.length === 0) return null;
    return validImages[Math.floor(Math.random() * validImages.length)];
}

function pickImage(...imageLists) {
    for (const imageList of imageLists) {
        const picked = getRandomImage(imageList);
        if (picked) return picked;
    }

    return null;
}

// SEND BIRTHDAY
async function sendBirthdayMessage(client, entry, previewChannel = null) {

    const data = bdayService.loadData();
    const channelId = process.env.BDAY_CHANNEL_ID;
    if (!channelId && !previewChannel) return;

    const channel = previewChannel || client.channels.cache.get(channelId);
    if (!channel) return;

    const useEmbed = data.messages?.birthday?.useEmbed ?? true;

    if (!data.messages?.birthday?.template) {
        console.warn('Birthday template not configured');
        return;
    }

    const name = entry.type === "user"
        ? `<@${entry.userId}>`
        : entry.name;

    let user = "";
    if (entry.type === "user") {
        if (entry.displayName) {
            user = entry.displayName;
        } else {
            try {
                const member = await channel.guild.members.fetch(entry.userId);
                user = member.displayName;
            } catch (err) {
                user = entry.name || "";
            }
        }
    }

    const age = bdayService.calculateAge(entry) ?? "";

    // CHECK FOR USER-SPECIFIC MESSAGE
    let template = data.messages.birthday.template;
    let userImageKey = null;
    if (entry.type === "user" && data.messages?.birthday?.userMessages?.[entry.userId]) {
        template = data.messages.birthday.userMessages[entry.userId];
        userImageKey = entry.userId;
    } else if (entry.type === "name" && data.messages?.birthday?.userMessages?.[entry.name]) {
        template = data.messages.birthday.userMessages[entry.name];
        userImageKey = entry.name;
    }

    const messageContent = formatTemplate(template, {
        name,
        user,
        age,
        type: "birthday",
        server: channel.guild.name ?? ""
    });

    // Get user-specific images if available, otherwise use global images
    const randomImage = pickImage(
        userImageKey ? data.messages?.birthday?.userImages?.[userImageKey] : null,
        data.messages?.birthday?.images,
        entry.images
    );

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

    const useEmbed = data.messages?.event?.useEmbed ?? true;

    if (!data.messages?.event?.template) {
        console.warn('Event template not configured');
        return;
    }

    // CHECK FOR CUSTOM MESSAGE FOR THIS EVENT
    let template = data.messages.event.template;
    if (data.messages?.event?.userMessages?.[event.name]) {
        template = data.messages.event.userMessages[event.name];
    }

    const messageContent = formatTemplate(template, {
        name: event.name,
        user: event.name,
        age: "",
        type: "event",
        server: channel.guild.name ?? ""
    });

    // Get event-specific images if available, otherwise use global images
    const randomImage = pickImage(
        data.messages?.event?.userImages?.[event.name],
        data.messages?.event?.images,
        event.images
    );

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