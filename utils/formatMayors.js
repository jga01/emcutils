const { convertUTCtoDays } = require("./convertUTCtoDays");

const formatMayors = (mayors) => {
    const mappedMayors = mayors.map((mayor) => {
        let days = convertUTCtoDays(mayor.timestamps.lastOnline);
        return `${mayor.name} of ${mayor.town} was last online ${days} ${days === 1 ? 'day' : 'days'} ago`;
    });
    return mappedMayors;
}

module.exports = {
    formatMayors,
}