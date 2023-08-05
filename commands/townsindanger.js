const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require('discord.js');
const { fetchNationMayors } = require('../utils/fetch');
const { sortMayors } = require('../utils/sortMayors');
const { formatMayors } = require('../utils/formatMayors');
const constants = require('../constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('townsindanger')
		.setDescription('Towns approaching deletion'),
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

		function customEmbedBuilder(title, content, description, footerText) {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(title)
				.setDescription(description)
				.setFooter({ text: `${footerText}`, iconURL: constants.ICON_URL });

				for (c of content) {
					embed.addFields({ name: '\u200B', value: c });
				}
			return embed;
		}

		const mayors = await fetchNationMayors('Brazil');
		let formattedMayors = Array.from(formatMayors(mayors));

		formattedMayors.splice(0, 50);

		console.log(formattedMayors);

		const content = formattedMayors;

		const message = await interaction.reply({ embeds: [customEmbedBuilder('Last Online', content, 'Test', constants.BOT_NAME)], components: [row()], fetchReply: true });

		const collector = message.createMessageComponentCollector({ ComponentType: ComponentType.Button, time: 5 * 60 * 1000 });

		collector.on('collect', async i => {
			if (i.customId === 'ascending') {
				await i.update({ embeds: [customEmbedBuilder('Last Online', content, 'Test', constants.BOT_NAME)], components: [row()] });
			}
			else if (i.customId === 'descending') {
				await i.update({ embeds: [customEmbedBuilder('Last Online', content, 'Test', constants.BOT_NAME)], components: [row()] });
			}
		});

		collector.on('end', collected => {
			console.log(`Collected ${collected.size} items`);
			interaction.editReply({ embeds: [customEmbedBuilder('Last Online', content, 'Test', constants.BOT_NAME)], components: [] });
		});
	},
};