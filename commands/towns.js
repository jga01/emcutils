const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { customEmbedBuilder } = require('../structures/embed');
const lodash = require('lodash');
const constants = require('../constants');
const fetch = require('../utils/fetch');

// Constants
const COMMAND_NAME = 'towns';
const COMMAND_DESCRIPTION = 'See a list of EarthMC towns';
const EMBED_TITLE = 'Towns';
const PAGE_SIZE = 10;

module.exports = {
	data: new SlashCommandBuilder()
		.setName(COMMAND_NAME)
		.setDescription(COMMAND_DESCRIPTION)
		.addStringOption((option) =>
			option
				.setName('nation')
				.setDescription('Nation to filter the towns by.')
				.setRequired(false)
		)
		.addIntegerOption((option) =>
			option
				.setName('lastonline')
				.setDescription('Days since the mayor was last online')
				.setRequired(false)
		)
		.addIntegerOption((option) =>
			option
				.setName('minchunks')
				.setDescription('Minimum amount of chunks')
				.setRequired(false)
		)
		.addIntegerOption((option) =>
			option
				.setName('population')
				.setDescription('Max number of residents')
				.setRequired(false)
		)
		.addBooleanOption((option) =>
			option
				.setName('isopen')
				.setDescription('Whether the town is open or not')
				.setRequired(false)
		),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: false });

		const options = {
			nation: interaction.options.getString('nation') || null,
			lastOnline: interaction.options.getInteger('lastonline') || 0,
			minChunks: interaction.options.getInteger('minchunks') || 0,
			population: interaction.options.getInteger('population') || 1,
			isOpen: interaction.options.getBoolean('isopen') || true,
		};

		const towns = await fetch.fetchAllTowns();

		const townsWithMayors = await Promise.all(towns.map(async (town) => {
			const now = new Date().getTime();
			try {
				let mayor = await fetch.fetchResident(town.mayor);
				const lastOnlineTime = mayor.timestamps?.lastOnline || 0;
				const daysSinceLastOnline = Math.floor((now - lastOnlineTime) / constants.MILLISECONDS_IN_A_DAY);
				mayor.daysOffline = daysSinceLastOnline;
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

		const filteredTowns = filterTowns(townsWithMayors, options);

		const formattedTowns = filteredTowns.map((town) => formatTownAsTableRow(town, options));

		let currentPage = 0;
		const totalPages = Math.ceil(formattedTowns.length / PAGE_SIZE);
		const paginatedTowns = paginateTowns(formattedTowns, totalPages, PAGE_SIZE);

		let daysOfflineAscending = 0;
		let chunksAscending = 0;
		let residentsAscending = 0;

		const message = await sendPage(interaction, paginatedTowns[currentPage], currentPage, totalPages);

		const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5 * 60 * 1000 });

		let sortedTowns = filteredTowns;

		collector.on('collect', async i => {
			let formattedSorted;
			const actions = {
				'next_page': async () => {
					if (currentPage < totalPages - 1) {
						currentPage++;
						formattedSorted = sortedTowns.map((town) => formatTownAsTableRow(town, options));
						formattedSorted = paginateTowns(formattedSorted, totalPages, PAGE_SIZE);
						await updatePage(i, formattedSorted[currentPage], currentPage, totalPages);
					}
				},
				'prev_page': async () => {
					if (currentPage > 0) {
						currentPage--;
						formattedSorted = sortedTowns.map((town) => formatTownAsTableRow(town, options));
						formattedSorted = paginateTowns(formattedSorted, totalPages, PAGE_SIZE);
						await updatePage(i, formattedSorted[currentPage], currentPage, totalPages);
					}
				},
				'days_offline': async () => {
					daysOfflineAscending = !daysOfflineAscending;
					sortedTowns = sortTowns(sortedTowns, 'mayor.daysOffline', daysOfflineAscending);
					formattedSorted = sortedTowns.map((town) => formatTownAsTableRow(town, options));
					formattedSorted = paginateTowns(formattedSorted, totalPages, PAGE_SIZE);
					await updatePage(i, formattedSorted[currentPage], currentPage, totalPages);
				},
				'chunks': async () => {
					chunksAscending = !chunksAscending;
					sortedTowns = sortTowns(sortedTowns, 'stats.numTownBlocks', chunksAscending);
					formattedSorted = sortedTowns.map((town) => formatTownAsTableRow(town, options));
					formattedSorted = paginateTowns(formattedSorted, totalPages, PAGE_SIZE);
					await updatePage(i, formattedSorted[currentPage], currentPage, totalPages);
				},
				'residents': async () => {
					residentsAscending = !residentsAscending;
					sortedTowns = sortTowns(sortedTowns, 'stats.numResidents', chunksAscending);
					formattedSorted = sortedTowns.map((town) => formatTownAsTableRow(town, options));
					formattedSorted = paginateTowns(formattedSorted, totalPages, PAGE_SIZE);
					await updatePage(i, formattedSorted[currentPage], currentPage, totalPages);
				}
			};

			if (actions[i.customId]) {
				actions[i.customId]();
			}
		});

		collector.on('end', (collected) => {
			console.log(`Collected ${collected.size} items`);
			interaction.editReply({ components: [] });
		});
	},
};

function filterTowns(towns, options) {
	return towns.filter((town) => {
		return (
			(options.nation === null || town.nation === options.nation) &&
			town.mayor.daysOffline >= options.lastOnline &&
			town.status.isOpen === options.isOpen &&
			town.stats.numTownBlocks >= options.minChunks &&
			town.stats.numResidents <= options.population
		);
	});
}

function sortTowns(towns, property, ascending) {
	return towns.sort((a, b) => {
		return ascending ? lodash.get(a, property) - lodash.get(b, property) : lodash.get(b, property) - lodash.get(a, property);
	});
}

function paginateTowns(towns, totalPages, pageSize) {
	const pages = [];
	for (let i = 0; i < totalPages; i++) {
		pages.push(towns.slice(i * pageSize, (i * pageSize) + pageSize).join('\n'));
	}
	return pages;
}

function setupPage(towns, currentPage, totalPages) {
	const tableHeaders = 'Town Name       | Days Offline | Chunks  | Residents | Status\n';
	const tableRows = towns;
	const content = '```' + tableHeaders + tableRows + '```';
	const components = createComponents(currentPage, totalPages);

	return { embeds: [customEmbedBuilder(EMBED_TITLE, content, `Page: ${currentPage + 1}/${totalPages}`, constants.BOT_NAME)], components };
}

async function sendPage(interaction, towns, currentPage, totalPages) {
	const obj = setupPage(towns, currentPage, totalPages);
	return await interaction.editReply(obj);
}

async function updatePage(interaction, towns, currentPage, totalPages) {
	const obj = setupPage(towns, currentPage, totalPages);
	return await interaction.update(obj);
}

function formatTownAsTableRow(town, options) {
	const name = town.name.padEnd(25);
	const daysOffline = ("00" + options.lastOnline).slice(-3);
	const chunks = ("00" + town.stats.numTownBlocks).slice(-3);
	const residents = ("00" + town.stats.numResidents).slice(-3);
	const status = town.status.isOpen ? 'Open' : 'Closed';

	return `${name}${daysOffline}\t\t${chunks}\t\t${residents}\t${status}`;
}

function createComponents(currentPage, totalPages) {
	return [
		new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('prev_page')
					.setEmoji('⬅️')
					.setDisabled(currentPage === 0)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('next_page')
					.setEmoji('➡️')
					.setDisabled(currentPage === totalPages - 1)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('days_offline')
					.setEmoji('⏳')
					.setDisabled(!totalPages)
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('chunks')
					.setEmoji('🌐')
					.setDisabled(!totalPages)
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('residents')
					.setEmoji('👤')
					.setDisabled(!totalPages)
					.setStyle(ButtonStyle.Secondary),
			),
	];
}
