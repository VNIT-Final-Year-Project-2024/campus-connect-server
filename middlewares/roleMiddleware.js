// role middleware to fetch role and permissions for the user

const mongoose = require('../utils/mongoConnector');
const Club = require('../models/clubs');

module.exports = (req, res, next) => {
    let clubId = req.query.clubId;

    if (!clubId) {
        return res.status(400).send("clubId is required in the request");
    }

    Club.findById(clubId, (err, club) => {
        if (err) {
            return res.status(500).send("Internal server error");
        } 
        if (!club) {
            return res.status(404).send("specified club does not exist");
        }

        // check if the user is a member of the club
        const member = club.members.find(member => member.user.id === req.user.id);

        if (!member) {
            return res.status(403).send("user is not a member of the club provided");
        }

        // append the role to req.user
        req.user.role = member.role;

        next();
    });
};
