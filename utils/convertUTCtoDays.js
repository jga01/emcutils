const { SECONDS_IN_A_DAY } = require("../constants");

function convertUTCtoDays(value) {
	const date = new Date().getTime();
	return Math.floor((date - value) / SECONDS_IN_A_DAY);
}

module.exports = {
	convertUTCtoDays,
};