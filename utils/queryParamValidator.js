validateQueryParams = (req, res, requiredParams) => {

    const queryParams = req.query;

    // Check if all required parameters are present
    const missingParams = requiredParams.filter(param => !queryParams.hasOwnProperty(param));

    if (missingParams.length > 0) {
        res.status(400).json({ message: `missing required query parameters: ${missingParams.join(', ')}` });
        return false;
    } 
    return true;
}

module.exports = {
    validateQueryParams
}