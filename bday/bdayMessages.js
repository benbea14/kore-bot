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

function normalizeMessageConfig(config) {
    if (!config) {
        return { template: '', image: null, title: null };
    }

    if (typeof config === 'string') {
        return { template: config, image: null, title: null };
    }

    return {
        template: config.template ?? config.text ?? config.content ?? '',
        image: config.image ?? config.pic ?? null,
        title: config.title ?? config.heading ?? null
    };
}

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

async function resolveBirthdayName(channel, entry) {
    if (entry.type !== 'user') {
        return entry.name;
    }

    if (entry.displayName) {
        return entry.displayName;
    }

    try {
        const member = await channel.guild.members.fetch(entry.userId);
        return member.nickname || member.user.username;
    } catch (error) {
        return entry.name || '';
    }
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

    const birthdayConfig = normalizeMessageConfig(data.messages?.birthday);

    if (!birthdayConfig.template) {
        console.warn('Birthday template not configured');
        return;
    }

    const name = await resolveBirthdayName(channel, entry);
    const user = entry.type === "user" ? `<@${entry.userId}>` : entry.name;

    const age = bdayService.calculateAge(entry) ?? "";

    // CHECK FOR USER-SPECIFIC MESSAGE
    let template = birthdayConfig.template;
    let selectedImage = birthdayConfig.image;
    let selectedTitle = birthdayConfig.title;
    if (entry.type === "user" && data.messages?.birthday?.userMessages?.[entry.userId]) {
        const userConfig = normalizeMessageConfig(data.messages.birthday.userMessages[entry.userId]);
        template = userConfig.template;
        selectedImage = userConfig.image || selectedImage;
        selectedTitle = userConfig.title || selectedTitle;
    } else if (entry.type === "name" && data.messages?.birthday?.userMessages?.[entry.name]) {
        const userConfig = normalizeMessageConfig(data.messages.birthday.userMessages[entry.name]);
        template = userConfig.template;
        selectedImage = userConfig.image || selectedImage;
        selectedTitle = userConfig.title || selectedTitle;
    }

    const messageContent = formatTemplate(template, {
        name,
        user,
        age,
        type: "birthday",
        server: channel.guild.name ?? ""
    });
    const messageTitle = selectedTitle
        ? formatTemplate(selectedTitle, {
            name,
            user,
            age,
            type: "birthday",
            server: channel.guild.name ?? ""
        })
        : null;

    const imagePool = Array.isArray(data.messages?.birthday?.images) ? data.messages.birthday.images : [];
    const randomImage = imagePool.length > 0
        ? imagePool[Math.floor(Math.random() * imagePool.length)]
        : null;
    const imageAsset = resolveBirthdayImageAsset(selectedImage || randomImage);

    if (useEmbed) {

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(messageContent);

        if (messageTitle) {
            embed.setTitle(messageTitle);
        }

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

        const contentWithTitle = messageTitle
            ? `**${messageTitle}**\n${messageContent}`
            : messageContent;

        if (imageAsset?.file) {
            await channel.send({ content: contentWithTitle, files: [imageAsset.file] });
            return;
        }

        const content = imageAsset?.remoteUrl
            ? `${contentWithTitle}\n${imageAsset.remoteUrl}`
            : contentWithTitle;

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

    const eventConfig = normalizeMessageConfig(data.messages?.event);

    if (!eventConfig.template) {
        console.warn('Event template not configured');
        return;
    }

    // CHECK FOR CUSTOM MESSAGE FOR THIS EVENT
    let template = eventConfig.template;
    let selectedImage = eventConfig.image;
    let selectedTitle = eventConfig.title;
    if (data.messages?.event?.userMessages?.[event.name]) {
        const userConfig = normalizeMessageConfig(data.messages.event.userMessages[event.name]);
        template = userConfig.template;
        selectedImage = userConfig.image || selectedImage;
        selectedTitle = userConfig.title || selectedTitle;
    }

    const messageContent = formatTemplate(template, {
        name: event.name,
        user: event.name,
        age: "",
        type: "event",
        server: channel.guild.name ?? ""
    });
    const messageTitle = selectedTitle
        ? formatTemplate(selectedTitle, {
            name: event.name,
            user: event.name,
            age: "",
            type: "event",
            server: channel.guild.name ?? ""
        })
        : null;

    const imagePool = Array.isArray(data.messages?.event?.images) && data.messages.event.images.length > 0
        ? data.messages.event.images
        : (Array.isArray(data.messages?.birthday?.images) ? data.messages.birthday.images : []);
    const randomImage = imagePool.length > 0
        ? imagePool[Math.floor(Math.random() * imagePool.length)]
        : null;
    const imageAsset = resolveBirthdayImageAsset(selectedImage || randomImage);

    if (useEmbed) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(messageContent);

        if (messageTitle) {
            embed.setTitle(messageTitle);
        }

        if (imageAsset?.remoteUrl) {
            embed.setImage(imageAsset.remoteUrl);
        } else if (imageAsset?.file) {
            embed.setImage(`attachment://${imageAsset.fileName}`);
        }

        if (imageAsset?.file) {
            await channel.send({ embeds: [embed], files: [imageAsset.file] });
            return;
        }

        await channel.send({ embeds: [embed] });

    } else {

        const contentWithTitle = messageTitle
            ? `**${messageTitle}**\n${messageContent}`
            : messageContent;

        if (imageAsset?.file) {
            await channel.send({ content: contentWithTitle, files: [imageAsset.file] });
            return;
        }

        const content = imageAsset?.remoteUrl
            ? `${contentWithTitle}\n${imageAsset.remoteUrl}`
            : contentWithTitle;

        await channel.send({ content });
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
