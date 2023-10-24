const { SlashCommandBuilder } = require('discord.js');
const { fetchAllTowns, fetchResidentData } = require('../utils/fetch');
const { sortMayorFunction } = require('../utils/sortMayors');
const { daysSinceLastOnline } = require('../utils/daysSinceLastOnline');

const COMMAND_NAME = 'inactiveopentowns';
const COMMAND_DESCRIPTION = 'See what inactive towns are open';
const EMBED_TITLE = 'List of towns about to get deleted';
const CONTENT_FORMAT = 'ini';

const filterOpenTowns = (towns) => {
    const filteredTowns = towns.filter(async (town) => {
        let mayor = await fetchResidentData(town.mayor);
        let time = daysSinceLastOnline(mayor.timestamps.lastOnline);

        town.mayor = mayor;

        return (town.status.isOpen && (time >= 41));
    });
    return filteredTowns;
}

// const updateMayorDataForTown = (towns) => {
//     const updatedTowns = towns.map(async (town) => {
//         const mayorData = await fetchResidentData(town.mayor);
//         return {
//             ...town,
//             mayor: mayorData,
//         };
//     });

//     return updatedTowns;
// }

module.exports = {
    data: new SlashCommandBuilder()
        .setName(COMMAND_NAME)
        .setDescription(COMMAND_DESCRIPTION),
    async execute(interaction) {
        const allTowns = await fetchAllTowns();
        const filteredOpenTowns = filterOpenTowns(allTowns);
        const mappedTowns = filteredOpenTowns.map((town) => {
            return `${town.name} is 1 day from being deleted and it's open.`;
        });

        let content = mappedTowns.join('\n');
		content = codeBlock(CONTENT_FORMAT, content);

        const message = await interaction.reply({ embeds: [customEmbedBuilder(EMBED_TITLE, content, constants.BOT_NAME)], components: [row()], fetchReply: true });
    },
}