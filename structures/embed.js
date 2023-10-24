const { EmbedBuilder } = require('discord.js');

function customEmbedBuilder(title, description, footerText) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: `${footerText}`, iconURL: constants.ICON_URL });
    return embed;
}

module.exports = {
    customEmbedBuilder,
}
