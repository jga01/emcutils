const fetch = require('cross-fetch');
const { convertUTCtoDays } = require('./convertUTCtoDays');

const EMC_API = 'https://emctoolkit.vercel.app/api';

async function getResidents() {
	const res = await fetch(`${EMC_API}/aurora/allplayers`);
	const json = await res.json();
	const players = json.map(p => {
		return `${p.name} was last seen ${convertUTCtoDays(p.lastOnline)} days ago`;
	});

	return players;
}

module.exports = {
	getResidents,
};