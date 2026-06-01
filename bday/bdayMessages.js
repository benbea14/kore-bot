const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const bdayService = require('./bdayService');

const LOCAL_IMAGE_PREFIX = 'local:';
const VOLUME_DATA_DIR = '/data';
const FALLBACK_DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_IMAGE_DIR = path.join(
    fs.existsSync(VOLUME_DATA_DIR) ? VOLUME_DATA_DIR : FALLBACK_DATA_DIR,
    'bday-images'
);

function resolveBirthdayImageAsset(imageRef) {
    if (!imageRef || typeof imageRef !== 'string') {
        return null;
    }

    if (!imageRef.startsWith(LOCAL_IMAGE_PREFIX)) {
        return { remoteUrl: imageRef };
    }

    const fileName = imageRef.slice(LOCAL_IMAGE_PREFIX.length);
    const absolutePath = path.join(LOCAL_IMAGE_DIR, fileName);

    if (!fs.existsSync(absolutePath)) {
        return null;
    }

    return {
        fileName,
        file: new AttachmentBuilder(absolutePath, { name: fileName })
    };
}

// PLACEHOLDER SYSTEM
function formatTemplate(template, data) {
    return template
        .replace(/{name}/g, data.name ?? "")
        .replace(/{user}/g, data.user ?? "")
        .replace(/{age}/g, data.age ?? "")
        .replace(/{type}/g, data.type ?? "")
        .replace(/{server}/g, data.server ?? "");
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
    if (entry.type === "user" && data.messages?.birthday?.userMessages?.[entry.userId]) {
        template = data.messages.birthday.userMessages[entry.userId];
    } else if (entry.type === "name" && data.messages?.birthday?.userMessages?.[entry.name]) {
        template = data.messages.birthday.userMessages[entry.name];
    }

    const messageContent = formatTemplate(template, {
        name,
        user,
        age,
        type: "birthday",
        server: channel.guild.name ?? ""
    });

    const imagePool = data.messages?.birthday?.images || [];
    const randomImage = imagePool.length > 0
        ? imagePool[Math.floor(Math.random() * imagePool.length)]
        : null;
    const imageAsset = resolveBirthdayImageAsset(randomImage);

    if (useEmbed) {

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(messageContent);

        if (imageAsset?.remoteUrl) {
            embed.setImage(imageAsset.remoteUrl);
            await channel.send({ embeds: [embed] });
            return;
        }

        if (imageAsset?.file) {
            embed.setImage(`attachment://${imageAsset.fileName}`);
            await channel.send({ embeds: [embed], files: [imageAsset.file] });
            return;
        }

        await channel.send({ embeds: [embed] });

    } else {

        if (imageAsset?.file) {
            await channel.send({ content: messageContent, files: [imageAsset.file] });
            return;
        }

        const content = imageAsset?.remoteUrl
            ? `${messageContent}\n${imageAsset.remoteUrl}`
            : messageContent;

        await channel.send({ content });
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

    if (useEmbed) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(messageContent);

        await channel.send({ embeds: [embed] });

    } else {

        await channel.send({ content: messageContent });
    }
}

// SEND SERVER ANNIVERSARY
async function sendServerMessage(client, previewChannel = null) {

    const data = bdayService.loadData();
    const channelId = process.env.BDAY_CHANNEL_ID;
    if (!channelId && !previewChannel) return;

    const channel = previewChannel || client.channels.cache.get(channelId);
    if (!channel) return;

    const useEmbed = data.messages?.server?.useEmbed ?? true;
    const template =
        data.messages?.server?.template ||
        "🎉 Happy Server Anniversary {server}! 💜";

    const messageContent = formatTemplate(template, {
        name: "",
        user: "",
        age: "",
        type: "server",
        server: channel.guild.name ?? ""
    });

    if (useEmbed) {

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(messageContent);

        await channel.send({ embeds: [embed] });

    } else {

        await channel.send({ content: messageContent });
    }
}

module.exports = {
    sendBirthdayMessage,
    sendEventMessage,
    sendServerMessage
};