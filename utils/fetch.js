const constants = require('../constants');

async function fetchResident(resident) {
    const response = await fetch(`${constants.RESIDENTS_ENDPOINT}/${resident}`);
    const data = await response.json();
    return data;
}

async function fetchTown(town) {
    const response = await fetch(`${constants.TOWNS_ENDPOINT}/${town}`);
    const data = await response.json();
    return data;
}

async function fetchNation(nation) {
    const response = await fetch(`${constants.NATIONS_ENDPOINT_ENDPOINT}/${nation}`);
    const data = await response.json();
    return data;
}

/* ----------------------- BULK FUNCTIONS ----------------------- */

async function fetchAllResidents() {
    const response = await fetch(constants.RESIDENTS_ENDPOINT);
    const data = await response.json();
    return data;
}

async function fetchAllTowns() {
    const response = await fetch(constants.TOWNS_ENDPOINT);
    const data = await response.json();
    return data;
}

async function fetchAllNations() {
    const response = await fetch(constants.NATIONS_ENDPOINT);
    const data = await response.json();
    return data;
}

module.exports = {
    fetchResident,
    fetchTown,
    fetchNation,

    fetchAllResidents,
    fetchAllTowns,
    fetchAllNations
}