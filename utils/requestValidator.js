validateRequest = (req, res, params) => {
  // required fields
  for (const field of params) {
    if (!(field in req.body)) {
      res.status(400).send(`${field} is required in the request`);
    }
  }
  // unexpected fields
  for (const field in req.body) {
    if (!params.includes(field)) {
      res.status(400).send(`Unexpected field ${field}`);
    }
  }
}

module.exports = {
    validateRequest
}