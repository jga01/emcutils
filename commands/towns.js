const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { customEmbedBuilder } = require('../structures/embed');
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
		// Defer reply to indicate the bot is working
		await interaction.deferReply({ ephemeral: false });

		// Default option values
		const lastOnline = interaction.options.getInteger('lastonline') || 0;
		const minChunks = interaction.options.getInteger('minchunks') || 0;
		const population = interaction.options.getInteger('population') || 1;
		const isOpen = interaction.options.getBoolean('isopen') || true;

		// Fetch town data
		const towns = await fetch.fetchAllTowns();

		const townsWithMayors = await Promise.all(towns.map(async (town) => {
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

		// Filter towns based on options
		const filteredTowns = filterTowns(townsWithMayors, lastOnline, minChunks, population, isOpen);

		const formattedTowns = filteredTowns.map((town) => formatTownAsTableRow(town, { lastOnline, minChunks, population, isOpen }));

		// Paginate the filtered towns
		let currentPage = 0;
		const totalPages = Math.ceil(formattedTowns.length / PAGE_SIZE);
		let paginatedTowns = paginateTowns(formattedTowns, totalPages, PAGE_SIZE);

		// Send the initial page
		const message = await sendPage(interaction, paginatedTowns[currentPage], currentPage, totalPages);

		// Create a collector to handle button clicks
		const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5 * 60 * 1000 });

		collector.on('collect', async i => {
			if (i.customId === 'next_page' && currentPage < totalPages - 1) {
				currentPage++;
			} else if (i.customId === 'prev_page' && currentPage > 0) {
				currentPage--;
			}

			// Update the displayed page
			await updatePage(i, paginatedTowns[currentPage], currentPage, totalPages);
		});

		collector.on('end', (collected) => {
			console.log(`Collected ${collected.size} items`);
			collected.editReply({ components: [] });
		});
	},
};

// Function to filter towns based on options
function filterTowns(towns, lastOnline, minChunks, population, isOpen) {
	const now = new Date().getTime();
	return towns.filter((town) => {
		const lastOnlineTime = town.mayor?.timestamps?.lastOnline || 0;
		const daysSinceLastOnline = Math.floor((now - lastOnlineTime) / constants.MILLISECONDS_IN_A_DAY);
		return (
			daysSinceLastOnline >= lastOnline &&
			town.status.isOpen === isOpen &&
			town.stats.numTownBlocks >= minChunks &&
			town.stats.numResidents <= population
		);
	});
}

// Function to paginate a list of towns
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
	const content = '```' + tableHeaders + tableRows + '```'; // Wrap the table in a code block for monospaced formatting
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


// Function to format a town as a table row
function formatTownAsTableRow(town, options) {
	const name = town.name.padEnd(25);
	const daysOffline = options.lastOnline < 10 ? `0${options.lastOnline}` : options.lastOnline;
	const chunks = town.stats.numTownBlocks < 100 ? ' ' : '';
	const residents = town.stats.numResidents < 100 ? ' ' : '';
	const status = town.status.isOpen ? 'Open' : 'Closed';

	return `${name} ${daysOffline}\t\t${chunks}${town.stats.numTownBlocks}     ${residents}${town.stats.numResidents}     ${status}`;
}

// Function to create navigation buttons
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
					.setStyle(ButtonStyle.Primary)
			),
	];
}
