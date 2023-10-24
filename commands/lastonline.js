const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, codeBlock } = require('discord.js');
const { fetchNationMayors } = require('../utils/fetch');
const { sortMayors } = require('../utils/sortMayors');
const { formatMayors } = require('../utils/formatMayors');
const { customEmbedBuilder } = require('../structures/embed');
const constants = require('../constants');

const COMMAND_NAME = 'lastonlinemayors';
const COMMAND_DESCRIPTION = 'See when mayors were last online';
const EMBED_TITLE = 'When mayors were last online';
const CONTENT_FORMAT = 'ini';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(COMMAND_NAME)
		.setDescription(COMMAND_DESCRIPTION),
	async execute(interaction) {
		const row = () => new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('ascending')
					.setEmoji('⬆️')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('descending')
					.setEmoji('⬇️')
					.setStyle(ButtonStyle.Primary),
			);

		const mayors = await fetchNationMayors('Brazil');
		const formattedMayors = formatMayors(mayors);

		let content = formattedMayors.join('\n');
		content = codeBlock(CONTENT_FORMAT, content);
		
		const message = await interaction.reply({ embeds: [customEmbedBuilder(EMBED_TITLE, content, constants.BOT_NAME)], components: [row()], fetchReply: true });

		const collector = message.createMessageComponentCollector({ ComponentType: ComponentType.Button, time: 5 * 60 * 1000 });

		collector.on('collect', async i => {
			if (i.customId === 'ascending') {
				const ascendingMayors = sortMayors(mayors, true);
				const formattedSortedMayors = formatMayors(ascendingMayors);

				content = formattedSortedMayors.join('\n');
				content = codeBlock(CONTENT_FORMAT, content);

				await i.update({ embeds: [customEmbedBuilder(EMBED_TITLE, content, constants.BOT_NAME)], components: [row()] });
			}
			else if (i.customId === 'descending') {
				const ascendingMayors = sortMayors(mayors, false);
				const formattedSortedMayors = formatMayors(ascendingMayors);

				content = formattedSortedMayors.join('\n');
				content = codeBlock(CONTENT_FORMAT, content);

				await i.update({ embeds: [customEmbedBuilder(EMBED_TITLE, content, constants.BOT_NAME)], components: [row()] });
			}
		});

		collector.on('end', collected => {
			console.log(`Collected ${collected.size} items`);
			interaction.editReply({ embeds: [customEmbedBuilder(EMBED_TITLE, content, constants.BOT_NAME)], components: [] });
		});
	},
};