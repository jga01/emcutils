const { convertUTCtoDays } = require('./convertUTCtoDays');
const { fetchNationMayors } = require('./fetch');

const getInactiveMayors = async (nation) => {
	const mayors = await fetchNationMayors(nation);

	const inactiveMayors = mayors.filter((mayor) => {
		let days = convertUTCtoDays(mayor.timestamps.lastOnline);
		// console.log('Mayor: ' + mayor.name + ' Last online: ' + mayor.timestamps.lastOnline + ' Days: ' + days);
		return (days >= 39 && days < 42);
	});

	return inactiveMayors;
};

module.exports = {
	getInactiveMayors,
};