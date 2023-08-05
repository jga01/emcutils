const { convertUTCtoDays } = require('./convertUTCtoDays');

// const getMayorsLastOnline = async (nation, period) => {
// 	const mayors = await fetchNationMayors(nation);

// 	const mayorsLastOnline = mayors.filter((mayor) => {
// 		let days = convertUTCtoDays(mayor.timestamps.lastOnline);
// 		return (days >= period && days < DAYS_BEFORE_DELETION);
// 	});

// 	return mayorsLastOnline;
// };

const sortMayors = (mayors, ascending) => {
	mayors.sort((mayor_a, mayor_b) => {
		let aLastOnline = convertUTCtoDays(mayor_a.timestamps.lastOnline);
		let bLastOnline = convertUTCtoDays(mayor_b.timestamps.lastOnline);
		return ascending ? aLastOnline - bLastOnline : bLastOnline - aLastOnline;
	})

	return mayors;
}

module.exports = {
	sortMayors,
};