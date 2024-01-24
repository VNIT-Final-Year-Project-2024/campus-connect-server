const mongoose = require('../utils/mongoConnector');
const Group = require('../models/groups');
const Message = require('../models/messages');

const { validateRequest } = require('../utils/requestValidator');
const { validateArray } = require('../utils/objArrayValidator');

// create new group (add requesting user to the group)
const newUserGroup = async (req, res) => {
    // validate request body
    let requiredFields = ['otherMember'];

    if (validateRequest(req, res, requiredFields)) {
        let memberParams = ['id', 'name'];
        let members = [];
        members.push(req.body.otherMember);
        if (validateArray(members, memberParams)) {
            let memberSize = members.length;
            if (memberSize !== 1) {
                res.status(400).send({ message: 'member not defined properly' });
                return;
            }

            members.push({ id: req.user.id, name: req.user.name });

            let id1 = members[0].id;
            let id2 = members[1].id;

            try {
                const groups = await Group.find({
                    is_chatroom: false,
                    members: {
                        $all: [
                            { $elemMatch: { id: id1 } },
                            { $elemMatch: { id: id2 } }
                        ]
                    }
                });

                if (groups.length > 0) {
                    res.status(409).send({ message: 'user group already exists' });
                } else {
                    let group = new Group({
                        is_chatroom: false,
                        members: members,
                    })

                    group.save()
                        .then(createdGroup => {
                            console.log('User:', req.user.name, 'created a user group with', req.body.otherMember.name,);
                            res.send({ status: 'success', groupId: createdGroup._id });
                        })
                        .catch(error => {
                            console.error('Error creating user group:', error);
                            res.status(500).send({ status: 'failed' });
                        });
                }
            } catch (error) {
                console.error('Error:', error);
                res.status(500).send('Internal Server Error');
            }

        } else {
            res.status(400).send({ message: 'user group not defined properly' });
        }
    }
}

// create new group (add requesting user to the group)
const newChatroomGroup = (req, res) => {
    // validate request body
    let requiredFields = ['name', 'desc', 'otherMembers'];

    if (validateRequest(req, res, requiredFields)) {
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
                members: members,
                description: req.body.desc,
            })

            group.save()
                .then(createdGroup => {
                    console.log('User: ', req.user.name, 'created a chatroom group: ', createdGroup.name);
                    res.send({ status: 'success', groupId: createdGroup._id });
                })
                .catch(error => {
                    console.error('Error creating chatroom group:', error);
                    res.status(500).send({ status: 'failed' });
                });
        } else {
            res.status(400).send({ message: 'chatroom group not defined properly' });
        }
    }
}

// view user groups for a user
const showUserGroups = async (req, res) => {

    let timestamp = new Date(req.timestamp);
    let pageSize = 10;
    let userId = req.user.id;

    try {
        // find groups that match members.id with the user's id and is_chatroom is false
        const matchingGroupsPipeline = [
            {
                $match: {
                    'members.id': userId,
                    is_chatroom: false
                }
            }
        ];

        // execute the aggregation pipeline for matching groups
        const matchingGroups = await Group.aggregate(matchingGroupsPipeline);

        // extract group IDs from matching groups
        const groupIds = matchingGroups.map(group => group._id);

        // find recent messages with a unique group_id directly in the database
        const recentMessagesPipeline = [
            {
                $match: {
                    group_id: { $in: groupIds },
                    timestamp: { $lt: timestamp }
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: '$group_id',
                    latestMessage: { $first: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$latestMessage' }
            },
            {
                $limit: pageSize
            }
        ];

        // execute the aggregation pipeline for recent messages for user
        const recentUserMessages = await Message.aggregate(recentMessagesPipeline);

        // map the results to the desired response structure
        const groups = recentUserMessages.map(({ _id, group_id, sender, content, timestamp }) => {
            const matchingGroup = matchingGroups.find(group =>
                group._id.equals(group_id)
            );
            const avatar = matchingGroup.avatar;

            // get member of the group (other than the user)
            const otherMember = matchingGroup.members.find(
                (member) => member.id !== userId
            );

            return {
                groupId: group_id.toString(),
                name: otherMember.name,
                recentMessage: {
                    messageId: _id.toString(),
                    sender: sender,
                    content,
                    timestamp
                },
                avatar: avatar
            };
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
};

// view chatroom groups for a user
const showChatroomGroups = async (req, res) => {

    let timestamp = new Date(req.timestamp);
    let pageSize = 10;
    let userId = req.user.id;

    try {
        // find groups that match members.id with user's id, sort by created_at and is_chatroom is true
        const matchingGroupsPipeline = [
            {
                $match: {
                    'members.id': userId,
                    is_chatroom: true
                }
            },
            {
                $sort: { created_at: -1 }
            }
        ];

        // execute the aggregation pipeline for matching groups
        const matchingGroups = await Group.aggregate(matchingGroupsPipeline);

        // extract group IDs from matching groups
        const groupIds = matchingGroups.map(group => group._id);

        // find recent messages with a unique group_id directly in the database
        const recentMessagesPipeline = [
            {
                $match: {
                    group_id: { $in: groupIds },
                    timestamp: { $lt: timestamp }
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: '$group_id',
                    latestMessage: { $first: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$latestMessage' }
            },
            {
                $limit: pageSize
            }
        ];

        // execute the aggregation pipeline for recent messages for user
        const recentUserMessages = await Message.aggregate(recentMessagesPipeline);

        // map the results to the desired response structure
        const groups = matchingGroups.map(matchingGroup => {
            const group_id = matchingGroup._id.toString();
            const avatar = matchingGroup.avatar;
            const name = matchingGroup.name;

            // check if there are recent messages for the group
            const recentMessage = recentUserMessages.find(message => message.group_id.equals(matchingGroup._id));

            if (recentMessage) {
                const { _id, sender, content, timestamp } = recentMessage;
                return {
                    groupId: group_id,
                    name: name,
                    recentMessage: {
                        messageId: _id.toString(),
                        sender: sender,
                        content,
                        timestamp
                    },
                    avatar: avatar
                };
            } else {
                // if no recent messages, include the group with created_at field
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
};

// search user groups for a user based on string provided
const searchUserGroups = async (req, res) => {

    // validate request query params
    const requiredParams = ['string'];

    if (validateQueryParams(req, res, requiredParams)) {

        let searchString = req.query.string;

        let timestamp = new Date(req.timestamp);
        let pageSize = 10;
        let userId = req.user.id;

        try {
            // find groups that match members.id with the user's id, is_chatroom is false, and other member's name contains searchString
            const matchingGroupsPipeline = [
                {
                    $match: {
                        'members.id': userId,
                        is_chatroom: false,
                        members: {
                            $elemMatch: {
                                id: { $ne: userId },
                                name: { $regex: searchString, $options: 'i' }       // case-insensitive search
                            }
                        }
                    }
                },
                {
                    $sort: { created_at: -1 }
                }
            ];

            // execute the aggregation pipeline for matching groups
            const matchingGroups = await Group.aggregate(matchingGroupsPipeline);

            // extract group IDs from matching groups
            const groupIds = matchingGroups.map(group => group._id);

            // find recent messages with a unique group_id directly in the database
            const recentMessagesPipeline = [
                {
                    $match: {
                        group_id: { $in: groupIds },
                        timestamp: { $lt: timestamp }
                    }
                },
                {
                    $sort: { timestamp: -1 }
                },
                {
                    $group: {
                        _id: '$group_id',
                        latestMessage: { $first: '$$ROOT' }
                    }
                },
                {
                    $replaceRoot: { newRoot: '$latestMessage' }
                },
                {
                    $limit: pageSize
                }
            ];

            // execute the aggregation pipeline for recent messages for user
            const recentUserMessages = await Message.aggregate(recentMessagesPipeline);

            // map the results to the desired response structure
            const groups = matchingGroups.map(matchingGroup => {
                const group_id = matchingGroup._id.toString();
                const avatar = matchingGroup.avatar;

                // check if there are recent messages for the group
                const recentMessage = recentUserMessages.find(message => message.group_id.equals(matchingGroup._id));

                // get member of the group (other than the user) based on search string
                const otherMember = matchingGroup.members.find(
                    (member) => member.id !== userId
                );

                if (recentMessage) {
                    const { _id, sender, content, timestamp } = recentMessage;
                    return {
                        groupId: group_id,
                        name: otherMember.name,
                        recentMessage: {
                            messageId: _id.toString(),
                            sender: sender,
                            content,
                            timestamp
                        },
                        avatar: avatar
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
    const requiredParams = ['string'];

    if (validateQueryParams(req, res, requiredParams)) {

        let searchString = req.query.string;
        let timestamp = new Date(req.timestamp);
        let pageSize = 10;
        let userId = req.user.id;

        try {
            // find groups that match members.id with user's id, sort by created_at, and is_chatroom is true
            const matchingGroupsPipeline = [
                {
                    $match: {
                        'members.id': userId,
                        is_chatroom: true,
                        name: { $regex: searchString, $options: 'i' }      // case-insensitive search
                    }
                },
                {
                    $sort: { created_at: -1 }
                }
            ];

            // execute the aggregation pipeline for matching groups
            const matchingGroups = await Group.aggregate(matchingGroupsPipeline);

            // extract group IDs from matching groups
            const groupIds = matchingGroups.map(group => group._id);

            // find recent messages with a unique group_id directly in the database
            const recentMessagesPipeline = [
                {
                    $match: {
                        group_id: { $in: groupIds },
                        timestamp: { $lt: timestamp }
                    }
                },
                {
                    $sort: { timestamp: -1 }
                },
                {
                    $group: {
                        _id: '$group_id',
                        latestMessage: { $first: '$$ROOT' }
                    }
                },
                {
                    $replaceRoot: { newRoot: '$latestMessage' }
                },
                {
                    $limit: pageSize
                }
            ];

            // execute the aggregation pipeline for recent messages for user
            const recentUserMessages = await Message.aggregate(recentMessagesPipeline);

            // map the results to the desired response structure
            const groups = matchingGroups.map(matchingGroup => {
                const group_id = matchingGroup._id.toString();
                const avatar = matchingGroup.avatar;
                const name = matchingGroup.name;

                // check if there are recent messages for the group
                const recentMessage = recentUserMessages.find(message => message.group_id.equals(matchingGroup._id));

                if (recentMessage) {
                    const { _id, sender, content, timestamp } = recentMessage;
                    return {
                        groupId: group_id,
                        name: name,
                        recentMessage: {
                            messageId: _id.toString(),
                            sender: sender,
                            content,
                            timestamp
                        },
                        avatar: avatar
                    };
                } else {
                    // if no recent messages, include the group with created_at field
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
    newUserGroup, newChatroomGroup,
    showUserGroups, showChatroomGroups,
    searchUserGroups, searchChatroomGroups
}