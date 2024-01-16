validateArray = (array, params) => {
    for(const item of array) {
        // required fields
        for (const field of params) {
            if (!(field in item)) {
                return false;
            }
        }
        // unexpected fields
        for (const field in item) {
            if (!params.includes(field)) {
                return false;
            }
        }
    }
    return true;
}

module.exports = {
    validateArray
}