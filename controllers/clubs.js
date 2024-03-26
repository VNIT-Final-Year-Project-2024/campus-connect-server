const mongoose = require('../utils/mongoConnector');
const Club = require('../models/clubs');
const Group = require('../models/groups');
const Message = require('../models/messages');

const permits = require('../access-control/permits.json');

const { validateRequest } = require('../utils/requestValidator');
const { validateQueryParams } = require('../utils/queryParamValidator');
const { validateArray } = require('../utils/objArrayValidator');
const { checkAccess } = require('../access-control/accessControl');

const { sendUpdateToGroup } = require('../socketApp');

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

// view club details
const fetchClubInfo = async (req, res) => {

    // validate request query params
    const requiredParams = ['clubId'];

    if (validateQueryParams(req, res, requiredParams)) {
        try {
            let clubId = req.query.clubId;

            let club = await Club.findById(clubId);
            if(!club) {
                res.status(404).json({ message: 'club not found' });
                return;
            }

            let { name, description, members, created_at: createdAt } = club;

            let clubInfo = {
                id: clubId,
                name,
                description,
                members,
                createdAt
            };

            res.status(200).json(clubInfo);

        } catch (error) {
            console.error('Error fetching club info:', error);
            res.status(500).json(error);
            return;
        }
    }
}

// send message into a group inside a club
const sendMessage = async (req, res) => {
    // validate request body
    let requiredFields = ['groupId', 'content'];

    if (validateRequest(req, res, requiredFields)) {
        if (req.body.content === null || req.body.content.trim() === "") {
            res.status(400).send({ message: 'message cannot be empty' });
            return; 
        }

        let groupId = req.body.groupId;

        try {
            // check membership of user against the provided group
            const group = await Group.findById(groupId);

            if (!group) {
                console.error('Group not found');
                res.status(404).send({ message: 'group does not exist' });
                return;
            }

            let clubId = group.associated_club;

            // RBAC - send message
            const access = await checkAccess(req, res, clubId, permits.SEND_MESSAGE);

            if (access) {
                if (group.members.some(member => member.id === req.user.id)) {
                    let message = new Message({
                        group_id: groupId,
                        sender: {
                            id: req.user.id,
                            name: req.user.name
                        },
                        content: req.body.content
                    });

                    const savedMessage = await message.save();

                    let msgUpdate = {
                        messageId: savedMessage.id,
                        sender: savedMessage.sender,
                        content: savedMessage.content,
                        timestamp: savedMessage.timestamp
                    };

                    // update the group's recent activity
                    group.recent_activity.message = savedMessage.id;
                    group.recent_activity.timestamp = savedMessage.timestamp;

                    await group.save();

                    sendUpdateToGroup(req.body.groupId, msgUpdate);
                    console.log('Message from user:', savedMessage.sender.name, 'sent:', `"${savedMessage.content}"`, 'to group:', groupId);
                    res.send({ status: 'success' });
                } else {
                    res.status(403).send({ message: 'not a member of the provided group' });
                }
            } else {
                // response sent through access controller
                return;
            }
        } catch (error) {
            console.error('Error getting details of group:', error);
            res.status(500).send('Internal server error');
            return;
        }
    }
}

const viewMessages = async (req, res) => {

    // validate request query params
    const requiredParams = ['groupId'];
  
    if (validateQueryParams(req, res, requiredParams)) {

        let groupId = req.query.groupId;

        // check membership of user against the provided group
        try {
            const group = await Group.findById(groupId);
    
            if (!group) {
                console.error('Group not found');
                res.status(404).send({ message: 'group does not exist' });
                return;
            }

            if (group.members.some(member => member.id === req.user.id)) {
  
                let pageSize = fetchApiPageSize;                                      // page size for messages
                let timestamp = new Date(req.timestamp);
            
                try {
                    const results = await Message.find({
                        group_id: req.query.groupId,
                        timestamp: { $lt: timestamp }                                 // retrieve messages older than the provided timestamp
                    })
                    .sort({ timestamp: -1 })
                    .limit(pageSize)
                    .select('_id sender content timestamp');
            
                    if (results.length === 0) {
                        res.status(200).json({ status: 'empty' });
                    } else {
            
                        const messages = results.map(({ _id, sender, content, timestamp }) => ({
                            messageId: _id,
                            sender: sender,
                            content: content,
                            timestamp: timestamp
                        }));
            
                        res.status(200).json({ status: 'success', messages: messages });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(500).send({ status: 'failed' });
                }

            } else {
                res.status(403).send({ message: 'not a member of the provided group' });
            }

        } catch (error) {
            console.error('Error getting details of group:', error);
            res.status(500).send('Internal server error');
            return;
        }
    }
}

// create new group inside club (add requesting user to the group)
const newChatroomGroup = async (req, res) => {

    // validate request body
    let requiredFields = ['clubId', 'name', 'desc', 'otherMembers'];

    if (validateRequest(req, res, requiredFields)) {

        let clubId = req.body.clubId;

        // RBAC - create group
        const access = await checkAccess(req, res, clubId, permits.CREATE_GROUP);
        if (access)
        {
            let memberParams = ['id', 'name'];
            if (validateArray(req.body.otherMembers, memberParams)) {

                let memberSize = req.body.otherMembers.length;
                if (memberSize === 0) {
                    res.status(400).send({ message: 'members not defined properly' });
                    return;
                }

                let members = req.body.otherMembers;
                members.push({ id: req.user.id, name: req.user.name });

                let group = new Group({
                    name: req.body.name,
                    is_chatroom: true,
                    associated_club: req.body.clubId,
                    members: members,
                    description: req.body.desc,
                })

                group.save()
                    .then(createdGroup => {
                        console.log('User: ', req.user.name, 'created a chatroom group: ', createdGroup.name, 'inside club:', req.body.clubId);
                        res.send({ status: 'success', groupId: createdGroup._id });
                    })
                    .catch(error => {
                        console.error('Error creating chatroom group:', error);
                        res.status(500).send({ status: 'failed' });
                    });

            } else {
                res.status(400).send({ message: 'chatroom group not defined properly' });
            }
        } else {
            // response sent through access controller
            return;
        }
    }
}

// view chatroom groups inside given club for a user
const showChatroomGroups = async (req, res) => {

    // validate request query params
    const requiredParams = ['clubId'];

    if (validateQueryParams(req, res, requiredParams)) {

        let clubId = req.query.clubId;
        console.log('Club ID:', clubId);
        let timestamp = new Date(req.timestamp);
        let userId = req.user.id;

        try {
            // find groups that match provided club and members.id with user's id 
            // sort by recent_activity timestamp or created_at
            const matchingGroupsPipeline = [
                {
                    $match: {
                        'members.id': userId,
                        is_chatroom: true,
                        associated_club: new mongoose.Types.ObjectId(clubId)
                    }
                },
                {
                    $lookup: {
                        from: "messages",
                        let: { group_id: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$group_id", "$$group_id"] },
                                    timestamp: { $lt: timestamp }
                                }
                            },
                            {
                                $sort: { timestamp: -1 }
                            },
                            {
                                $limit: 1
                            }
                        ],
                        as: "recent_activity"
                    }
                },
                {
                    $addFields: {
                        recent_activity: { $arrayElemAt: ["$recent_activity", 0] }
                    }
                },
                {
                    $addFields: {
                        sortField: { $ifNull: ["$recent_activity.timestamp", "$created_at"] }
                    }
                },
                {
                    $match: {
                        $or: [
                            { "recent_activity.timestamp": { $lt: timestamp } },
                            { created_at: { $lt: timestamp } }
                        ]
                    }
                },
                {
                    $sort: { sortField: -1 }
                },
                {
                    $limit: fetchApiPageSize
                }
            ];

            // execute the aggregation pipeline for matching groups
            const matchingGroups = await Group.aggregate(matchingGroupsPipeline);

            // map the results to the response structure
            const groups = matchingGroups.map(matchingGroup => {
                const group_id = matchingGroup._id.toString();
                const avatar = matchingGroup.avatar;
                const name = matchingGroup.name;
                const recentActivity = matchingGroup.recent_activity;

                if (recentActivity) {
                    const { _id, sender, content, timestamp } = recentActivity;
                    // group with recent activity
                    return {
                        groupId: group_id,
                        name: name,
                        recentMessage: {
                            messageId: _id.toString(),
                            sender: sender,
                            content: content,
                            timestamp: timestamp
                        },
                        avatar: avatar
                    };
                } else {
                    // group with no recent activity
                    return {
                        groupId: group_id,
                        name: name,
                        avatar: avatar,
                        created_at: matchingGroup.created_at
                    };
                }
            });

            if (groups.length === 0) {
                res.status(200).json({ status: 'empty' });
            } else {
                res.status(200).json({ status: 'success', groups: groups });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'failed' });
        }
    }
};

// search chatroom groups for a user based on string provided
const searchChatroomGroups = async (req, res) => {

    // validate request query params
    const requiredParams = ['clubId', 'string'];

    if (validateQueryParams(req, res, requiredParams)) {

        let searchString = req.query.string;
        let clubId = req.query.clubId;
        let timestamp = new Date(req.timestamp);
        let userId = req.user.id;

        try {
            // find groups that match members.id with the user's id, is_chatroom is true, and group's name contains searchString
            const matchingGroupsPipeline = [
                {
                    $match: {
                        'members.id': userId,
                        is_chatroom: true,
                        associated_club: new mongoose.Types.ObjectId(clubId),
                        name: { $regex: searchString, $options: 'i' }               // case-insensitive search
                    }
                },
                {
                    $lookup: {
                        from: "messages",
                        let: { group_id: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$group_id", "$$group_id"] },
                                    timestamp: { $lt: timestamp }
                                }
                            },
                            {
                                $sort: { timestamp: -1 }
                            },
                            {
                                $limit: 1
                            }
                        ],
                        as: "recent_activity"
                    }
                },
                {
                    $addFields: {
                        recent_activity: { $arrayElemAt: ["$recent_activity", 0] }
                    }
                },
                {
                    $addFields: {
                        sortField: { $ifNull: ["$recent_activity.timestamp", "$created_at"] }
                    }
                },
                {
                    $match: {
                        $or: [
                            { "recent_activity.timestamp": { $lt: timestamp } },
                            { created_at: { $lt: timestamp } }
                        ]
                    }
                },
                {
                    $sort: { sortField: -1 }
                },
                {
                    $limit: fetchApiPageSize
                }
            ];

            // execute the aggregation pipeline for matching groups
            const matchingGroups = await Group.aggregate(matchingGroupsPipeline);

            // map the results to the response structure
            const groups = matchingGroups.map(matchingGroup => {
                const group_id = matchingGroup._id.toString();
                const avatar = matchingGroup.avatar;
                const name = matchingGroup.name;
                const recentActivity = matchingGroup.recent_activity;

                if (recentActivity) {
                    const { _id, sender, content, timestamp } = recentActivity;
                    // group with recent activity
                    return {
                        groupId: group_id,
                        name: name,
                        recentMessage: {
                            messageId: _id.toString(),
                            sender: sender,
                            content: content,
                            timestamp: timestamp
                        },
                        avatar: avatar
                    };
                } else {
                    // group with no recent activity
                    return {
                        groupId: group_id,
                        name: name,
                        avatar: avatar,
                        created_at: matchingGroup.created_at
                    };
                }
            });

            if (groups.length === 0) {
                res.status(200).json({ status: 'empty' });
            } else {
                res.status(200).json({ status: 'success', groups: groups });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'failed' });
        }
    }
};

module.exports = {
    newClub, showAllClubs, fetchClubInfo,
    sendMessage, viewMessages,
    newChatroomGroup, showChatroomGroups, searchChatroomGroups
}