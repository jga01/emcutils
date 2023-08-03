function convertUTCtoDays(value) {
	const date = new Date().getTime();
	return Math.floor((date - value) / 8.64e7);
}

module.exports = {
	convertUTCtoDays,
};