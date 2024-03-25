const mongoose = require('../utils/mongoConnector');
const Club = require('../models/clubs');

const { executeQuery } = require('../utils/queryExectutor');

checkAccess = async (req, res, clubId, permitMask) => {
    
    userId = req.user.id;

    try {
        // check membership of user against the provided club
        let club = await Club.findById(clubId);

        if (!club) {
            console.error('Club not found');
            res.status(404).send({ message: 'club does not exist' });
            return false;
        }

        let member = club.members.find(member => member.user.id === userId);

        if (member) {
            let userRoleId = member.role.id;
            let permissions;

            // SQL query to get permissions for role
            let query = `SELECT permissions FROM role WHERE id = '${userRoleId}' LIMIT 1`;

            // Wrap the SQL query in a promise
            const permissionsResult = await new Promise((resolve, reject) => {
                executeQuery(query, (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });

            console.log(`Permissions for User: ${req.user.name} fetched over Club: ${clubId}`);
            permissions = permissionsResult[0].permissions;

            // apply permitMask using bitwise AND operation
            if (permissions & permitMask) {
                console.log('Access granted');
                return true;
            } else {
                console.log('Access denied');
                res.status(403).send({ message: 'access to requested operation denied' });
                return false;
            }
        } else {
            res.status(403).send({ message: 'not a member of the provided club' });
            return false;
        }
    } catch (error) {
        console.error('Error getting details of club:', error);
        res.status(500).send('Internal server error');
        return false;
    }
}

module.exports = {
    checkAccess
}