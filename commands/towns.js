const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, codeBlock } = require('discord.js');
const { customEmbedBuilder } = require('../structures/embed');

const constants = require('../constants');
const fetch = require('../utils/fetch');

const COMMAND_NAME = 'towns';
const COMMAND_DESCRIPTION = 'See a list of EarthMC towns';
const EMBED_TITLE = 'Towns';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(COMMAND_NAME)
		.setDescription(COMMAND_DESCRIPTION)
		.addIntegerOption(option =>
			option
				.setName('lastonline')
				.setDescription('Days since the mayor was last online')
				.setRequired(false))
		.addIntegerOption(option =>
			option
				.setName('minchunks')
				.setDescription('Minimum amount of chunks')
				.setRequired(false))
		.addIntegerOption(option =>
			option
				.setName('population')
				.setDescription('Max number of residents')
				.setRequired(false))
		.addBooleanOption(option =>
			option
				.setName('isopen')
				.setDescription('Whether the town is open or not')
				.setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: false });

		const row = (disable_prev, disable_next) => new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('prev_page')
					.setEmoji('⬅️')
					.setDisabled(disable_prev)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('next_page')
					.setEmoji('➡️')
					.setDisabled(disable_next)
					.setStyle(ButtonStyle.Primary),
			);

		const lastOnline = interaction.options.getInteger('lastonline') ?? 0;
		const minChunks = interaction.options.getInteger('minchunks') ?? 0;
		const population = interaction.options.getInteger('population') ?? 1;
		const isOpen = interaction.options.getBoolean('isopen') ?? true;

		const towns = await fetch.fetchAllTowns();

		const townsWithMayors = await Promise.all(towns.map(async (town, index) => {
			try {
				const mayor = await fetch.fetchResident(town.mayor);
				town.mayor = mayor;
				return town;
			} catch (error) {
				if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
					console.error(`Connection timeout error for town ${town.name}: ${error.message}`);
				} else {
					console.error(`Error fetching mayor for town ${town.name}: ${error.message}`);
				}
				return town;
			}
		}));

		const filteredTowns = townsWithMayors.filter((town) => {
			const date = new Date().getTime();
			let days = Math.floor((date - town.mayor?.timestamps?.lastOnline) / constants.MILLISECONDS_IN_A_DAY);
			days = isNaN(days) ? 0 : days;

			const checkMayorLastOnline = days >= lastOnline;
			const checkOpen = town.status.isOpen == isOpen;
			const checkChunks = town.stats.numTownBlocks >= minChunks;
			const checkPopulation = town.stats.numResidents <= population;

			return checkMayorLastOnline && checkOpen && checkChunks && checkPopulation;
		});

		let content = filteredTowns.map((town) =>
			`${town.name} | T: ${constants.DAYS_BEFORE_DELETION - lastOnline} | C: ${town.stats.numTownBlocks} | R: ${town.stats.numResidents} | O: ${town.status.isOpen ? 'Y' : 'N'}`
		);

		function chunkArray(array, chunkSize) {
			const chunks = [];
			for (let i = 0; i < array.length; i += chunkSize) {
				chunks.push(array.slice(i, i + chunkSize));
			}
			return chunks;
		}

		const chunkSize = 4096 / 64;

		const chunks = chunkArray(content, chunkSize);

		let currentPage = 0;

		let disable_prev = true;
		let disable_next = chunks.length <= 1;

		let ctn = codeBlock(chunks[currentPage].join('\n'));

		const message = await interaction.editReply({ embeds: [customEmbedBuilder(EMBED_TITLE, ctn, `Page: ${currentPage}/${chunks.length - 1}`, constants.BOT_NAME)], components: [row(disable_prev, disable_next)], fetchReply: true });

		const collector = message.createMessageComponentCollector({ ComponentType: ComponentType.Button, time: 5 * 60 * 1000 });

		collector.on('collect', async i => {
			if (i.customId === 'next_page' && currentPage < chunks.length - 1) {
				currentPage++;
			} else if (i.customId === 'prev_page' && currentPage > 0) {
				currentPage--;
			}

			disable_prev = currentPage === 0;
			disable_next = currentPage === chunks.length - 1;

			const ctn = codeBlock(chunks[currentPage].join('\n'));

			await i.update({ embeds: [customEmbedBuilder(EMBED_TITLE, ctn, `Page: ${currentPage}/${chunks.length - 1}`, constants.BOT_NAME)], components: [row(disable_prev, disable_next)] });
		});

		collector.on('end', collected => {
			console.log(`Collected ${collected.size} items`);
			interaction.editReply({ embeds: [customEmbedBuilder(EMBED_TITLE, codeBlock(chunks[currentPage].join('\n'), `Page: ${currentPage}/${chunks.length - 1}`), constants.BOT_NAME)], components: [] });
		});
	},
};