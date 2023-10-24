const { SlashCommandBuilder } = require('discord.js');
const { fetchAllTowns } = require('../utils/fetch');
const { sortMayorFunction } = require('../utils/sortMayors');

const COMMAND_NAME = 'inactiveopentowns';
const COMMAND_DESCRIPTION = 'See what inactive towns are open';
const EMBED_TITLE = 'When mayors were last online';
const CONTENT_FORMAT = 'ini';

const filterOpenTowns = (towns) => {
    const filteredTowns = towns.filter((town) => town.status.isOpen)
}

const updateMayorDataForTown = (towns) => {
    const updatedTowns = towns.map(async (town) => {
	    const mayorData = await fetchResidentData(town.mayor);
        return {
            ...town,
            mayor: mayorData,
        };
    });

    return updatedTowns;
}

// Get all town names -> Get all town data -> Filter open towns -> 

module.exports = {
    data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(COMMAND_DESCRIPTION),
    async execute(interaction) {
        const allTowns = await fetchAllTowns();
        const filteredOpenTowns = filterOpenTowns(allTowns);
        const updatedTownsWithMayorData = updateMayorDataForTown(filteredOpenTowns);
        const sortedTowns = updatedTownsWithMayorData.sort(sortMayorFunction(true));

        const message = await interaction.reply({ embeds: [customEmbedBuilder(EMBED_TITLE, content, constants.BOT_NAME)], components: [row()], fetchReply: true });
    },
}