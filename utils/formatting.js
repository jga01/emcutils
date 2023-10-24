const mapPropertyToString = (array, property) => {
    const mappedArray = array.map((elem) => `${elem[property]}`);
    return mappedArray;
}

module.exports = {
    mapPropertyToString,
}