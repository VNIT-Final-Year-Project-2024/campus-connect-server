const mongoose = require('../utils/mongoConnector');
const Club = require('../models/clubs');

const { validateRequest } = require('../utils/requestValidator');
const { validateArray } = require('../utils/objArrayValidator');

const fetchApiPageSize = 20;

// create new club
// TODO: turn this into a request template to be approved by the admin
const newClub = async (req, res) => {
    // validate request body
    let requiredFields = ['name', 'members', 'desc'];

    if (validateRequest(req, res, requiredFields)) {
        if (req.body.name.length > 30) {
            res.status(400).send('club name must not exceed 30 characters.');
        }

        let memberParams = ['role', 'user'];
    
        if (validateArray(req.body.members, memberParams)) {

            let roleIds = new Set();
    
            req.body.members.forEach(member => {
                if (typeof member.role !== 'object' || typeof member.role.id !== 'number') {
                    res.status(400).send('roles not specified properly');
                    return;
                } else {
                    roleIds.add(member.role.id);
                }
    
                if (typeof member.user !== 'object' || typeof member.user.id !== 'number') {
                    res.status(400).send('members not specified properly');
                    return;
                }
            });

            // ROLE ID - 1: Professor, 2: President, 3: Treasurer
    
            if (![1, 2, 3].every(roleId => roleIds.has(roleId))) {
                res.status(400).send('a professor, president, and treasurer must be present in the members provided');
                return;
            }

            let club = new Club({
                name: req.body.name,
                description: req.body.desc,
                members: req.body.members,
                created_by: {
                    id: req.user.id,
                    name: req.user.name
                }
            })

            club.save()
                .then(createdClub => {
                    console.log('User: ', req.user.name, 'created a club: ', createdClub.name);
                    res.send({ status: 'success', clubId: createdClub._id });
                })
                .catch(error => {
                    console.error('Error creating a club:', error);
                    res.status(500).send({ status: 'failed' });
                });

        } else {
            res.status(400).send('members field not specified properly');
        }
    }
}

// view all clubs for user
const showAllClubs = async (req, res) => {
    try {
        // fetch clubs where members array has user.id equal to req.user.id
        const clubs = await Club.find({ 'members.user.id': req.user.id });

        // map the fetched clubs to the desired response structure
        const mappedClubs = clubs.map(club => ({
            id: club.id,
            name: club.name,
            description: club.description,
            members: club.members.map(member => ({
                user: { id: member.user.id, name: member.user.name },
                role: member.role.name
            }))
        }));

        res.status(200).json(mappedClubs);
    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    newClub, showAllClubs
}