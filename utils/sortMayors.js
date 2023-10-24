const { convertUTCtoDays } = require('./convertUTCtoDays');

const sortMayorFunction = (mayor_a, mayor_b, ascending) => {
	let aLastOnline = convertUTCtoDays(mayor_a.timestamps.lastOnline);
	let bLastOnline = convertUTCtoDays(mayor_b.timestamps.lastOnline);
	return ascending ? aLastOnline - bLastOnline : bLastOnline - aLastOnline;
}

const sortMayors = (mayors, ascending) => {
	mayors.sort(sortMayorFunction(ascending));

	return mayors;
}

module.exports = {
	sortMayors,
};