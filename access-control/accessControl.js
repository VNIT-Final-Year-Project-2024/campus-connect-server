const mongoose = require('../utils/mongoConnector');
const Club = require('../models/clubs');

const { executeQuery } = require('../utils/queryExectutor');

checkAccess = (req, res, clubId, permitMask) => {

    userId = req.user.id;

    // check membership of user against the provided club
    Club.findById(clubId).then(club => {
    
        if (!club) {
            console.error('Club not found');
            res.status(404).send({ message: 'club does not exist' });
            return;
        }

        let member = club.members.findOne(member => member.user.id === userId);

        if (member) {

            let userRoleId = member.role.id;
            let permissions;

            // SQL query to get permissions for role
            let query = `SELECT permissions FROM role WHERE id = '${userRoleId}' LIMIT 1`;
            // using the executeQuery function
            executeQuery(query, async (error, results) => {
            if (error) {
                res.status(500).json(error);
                return;
            } else {
                console.log(`Permissions for User: ${req.body.name} fetched over Club: ${clubId}`);
                permissions = results[0].permissions;
            }
            });

            // apply permitMask using bitwise AND operation
            if (permissions & permitMask) {
                return;
            } else {
                res.status(403).send({ message: 'access to requested operation denied' });
                return;
            }

        } else {
            res.status(403).send({ message: 'not a member of the provided club' });    
        }

    }).catch(error => {
        console.error('Error getting details of club:', error);
        res.status(500).send('Internal server error');
        return;
    });
}

module.exports = {
    checkAccess
}