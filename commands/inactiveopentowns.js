const COMMAND_NAME = 'inactiveopentowns';
const COMMAND_DESCRIPTION = 'See what inactive towns are open';
const EMBED_TITLE = 'When mayors were last online';
const CONTENT_FORMAT = 'ini';

const filterOpenTowns = (towns) => {
    const filteredTowns = towns.filter((town) => town.status.isOpen)
}

const filterInactiveTowns = (towns) => {
    const filteredTowns = towns.map((town) => {
	    const mayor = fetch
    });
}

// Get all town names -> Get all town data -> Filter open towns -> 

// module.exports = {
//     data: new SlashCommandBuilder()
//     .setName(COMMAND_NAME)
//     .setDescription(COMMAND_DESCRIPTION),
// }
