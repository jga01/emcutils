const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require ('discord.js');
const { getInactiveMayors } = require('../utils/getInactiveMayors');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('townsindanger')
		.setDescription('Towns approaching deletion'),
	async execute(interaction) {
		const row = (isBackDisabled, isForwardDisabled) => new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('back_button')
					.setEmoji('⬅️')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(isBackDisabled),
				new ButtonBuilder()
					.setCustomId('forward_button')
					.setEmoji('➡️')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(isForwardDisabled),
			);

		function customEmbedBuilder(title, description, footerText) {
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(title)
				.setDescription(description)
				.setFooter({ text: `${footerText}` });
			return embed;
		}

		const inactiveMayors = await getInactiveMayors('Brazil');

		console.log(inactiveMayors);

		const townNames = inactiveMayors.map((mayor) => mayor.town);

		console.log(townNames);

		const arrays = [], size = 10;

		let currentPage = 0;
		
		while (townNames.length > 0) arrays.push('```arm\n' + townNames.splice(0, size).join('\n') + '```\n');

		console.log(arrays);

		const message = await interaction.reply({ embeds: [customEmbedBuilder('Towns that will get deleted in 72hrs', arrays[0], `Page ${currentPage}/${arrays.length - 1}`)], components: [row(true, false)], fetchReply: true });

		const collector = message.createMessageComponentCollector({ ComponentType: ComponentType.Button, time: 5 * 60 * 1000 });

		collector.on('collect', async i => {
			if (i.customId === 'back_button') {
				currentPage--;
				await i.update({ embeds: [customEmbedBuilder('Towns in danger', arrays[currentPage], `Page ${currentPage}/${arrays.length - 1}`)], components: [row((currentPage == 0 ? true : false), false)] });
			}
			else if (i.customId === 'forward_button') {
				currentPage++;
				await i.update({ embeds: [customEmbedBuilder('Towns in danger', arrays[currentPage], `Page ${currentPage}/${arrays.length - 1}`)], components: [row(false, (currentPage == (arrays.length - 1) ? true : false))] });
			}
		});

		collector.on('end', collected => {
			console.log(`Collected ${collected.size} items`);
			interaction.editReply({ embeds: [customEmbedBuilder('Towns in danger', arrays[currentPage], `Page ${currentPage}/${arrays.length}`)], components: [] });
		});
	},
};