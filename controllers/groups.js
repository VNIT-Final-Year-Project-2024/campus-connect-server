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
    // validate request header
    let requiredFields = [];

    if (validateQueryParams(req, res, requiredFields)) {
        let timestamp = new Date(req.timestamp);
        let pageSize = 10;                                          // page size for groups
        let userId = req.user.id;

        try {
            // find recent messages with a unique group_id
            const recentMessagesPipeline = [
                {
                    $match: { timestamp: { $lt: timestamp } }       // filter messages strictly before the specified timestamp

                },
                {
                    $sort: { timestamp: -1 }                        // sort messages by timestamp in descending order
                },
                {
                    $group: {
                        _id: '$group_id',
                        latestMessage: { $first: '$$ROOT' }         // keep the latest message for each group
                    }
                },
                {
                    $replaceRoot: { newRoot: '$latestMessage' }     // replace the root with the latest messages
                },
                {
                    $limit: pageSize                                // limit the results to the specified page size
                }
            ];

            // find groups that match members.id with the provided id
            const matchingGroupsPipeline = [
                {
                    $match: {
                        'members.id': userId,
                        is_chatroom: false
                    }
                }
            ];

            // execute the aggregation pipeline for recent messages
            const recentMessages = await Message.aggregate(recentMessagesPipeline);

            // extract group IDs from recent messages
            const groupIds = recentMessages.map(message => message.group_id);

            // add group_id to matchingGroupsPipeline for filtering
            matchingGroupsPipeline[0].$match._id = { $in: groupIds };

            // execute the aggregation pipeline for matching groups
            const matchingGroups = await Group.aggregate(matchingGroupsPipeline);

            // filter recent messages based on matching groups and convert ObjectId to string
            const groups = recentMessages
                .filter(message => matchingGroups.some(group => group._id.equals(message.group_id)))
                .map(({ _id, group_id, sender, content, timestamp }) => {

                    // find the matching group based on group_id
                    const matchingGroup = matchingGroups.find((group) =>
                        group._id.equals(group_id)
                    );

                    // pick the name - for client rendering
                    const otherMember = matchingGroup.members.find(
                        (member) => member.id !== userId
                    );

                    return {
                        groupId: group_id.toString(),
                        otherMemberName: otherMember.name,
                        recentMessage: {
                            messageId: _id.toString(),
                            sender: sender,
                            content,
                            timestamp
                        },
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
    }
};

// view chatroom groups for a user
const showChatroomGroups = async (req, res) => {
    // validate request body
    let requiredFields = [];

    if (validateQueryParams(req, res, requiredFields)) {
        let timestamp = new Date(req.timestamp);
        let pageSize = 10;                                          // page size for groups
        let userId = req.user.id;

        try {
            // find recent messages with a unique group_id
            const recentMessagesPipeline = [
                {
                    $match: { timestamp: { $lt: timestamp } }       // filter messages strictly before the specified timestamp

                },
                {
                    $sort: { timestamp: -1 }                        // sort messages by timestamp in descending order
                },
                {
                    $group: {
                        _id: '$group_id',
                        latestMessage: { $first: '$$ROOT' }         // keep the latest message for each group
                    }
                },
                {
                    $replaceRoot: { newRoot: '$latestMessage' }     // replace the root with the latest messages
                },
                {
                    $limit: pageSize                                // limit the results to the specified page size
                }
            ];

            // find groups that match members.id with the provided id
            const matchingGroupsPipeline = [
                {
                    $match: {
                        'members.id': userId,
                        is_chatroom: true
                    }
                }
            ];

            // execute the aggregation pipeline for recent messages
            const recentMessages = await Message.aggregate(recentMessagesPipeline);

            // extract group IDs from recent messages
            const groupIds = recentMessages.map(message => message.group_id);

            // add group_id to matchingGroupsPipeline for filtering
            matchingGroupsPipeline[0].$match._id = { $in: groupIds };

            // execute the aggregation pipeline for matching groups
            const matchingGroups = await Group.aggregate(matchingGroupsPipeline);

            // filter recent messages based on matching groups and convert ObjectId to string
            const groups = recentMessages
                .filter(message => matchingGroups.some(group => group._id.equals(message.group_id)))
                .map(({ _id, group_id, sender, content, timestamp }) => ({
                    groupId: group_id.toString(),
                    recentMessage: {
                        messageId: _id.toString(),
                        sender: sender,
                        content,
                        timestamp
                    }
                }));

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
    showUserGroups, showChatroomGroups
}