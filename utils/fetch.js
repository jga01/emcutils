const fetch = require('cross-fetch')

const nationEndpoint = "https://api.earthmc.net/v2/aurora/nations";
const townEndpoint = "https://api.earthmc.net/v2/aurora/towns";
const townListsEndpoint = "https://api.earthmc.net/v2/aurora/lists/towns";
const residentsEndpoint = "https://api.earthmc.net/v2/aurora/residents";

const fetchAllTownNames = async () => {
    const response = await fetch(townListsEndpoint);
    const data = await response.json();
    return data;
}

const fetchAllTowns = async () => {
    const allTownNames = await fetchAllTownNames();

    const allTownPromises = allTownNames.map((town) =>
        fetchTownData(town)
    );

    const allTownsData = Promise.all(allTownPromises);
    return allTownsData;
}

const fetchNationData = async (nation) => {
    const response = await fetch(`${nationEndpoint}/${nation}`);
    const data = await response.json();
    return data;
}

const fetchTownData = async (town) => {
    const response = await fetch(`${townEndpoint}/${town}`);
    const data = await response.json();
    return data;
};

const fetchResidentData = async (resident) => {
    const response = await fetch(`${residentsEndpoint}/${resident}`);
    const data = await response.json();
    return data;
}

const fetchNationTowns = async (nation) => {
    const nationData = await fetchNationData(nation);
    const towns = nationData.towns;

    const townPromises = towns.map((town) =>
        fetchTownData(town)
    );

    const townsData = Promise.all(townPromises);
    return townsData;
}

const fetchNationMayors = async (nation) => {
    const towns = await fetchNationTowns(nation);

    const mayorPromises = towns.map((town) =>
        fetchResidentData(town.mayor)
    );

    const mayorsData = Promise.all(mayorPromises);
    return mayorsData;
}

module.exports = {
    fetchAllTownNames,
    fetchAllTowns,
    fetchNationData,
    fetchTownData,
    fetchResidentData,
    fetchNationTowns,
    fetchNationMayors,
};