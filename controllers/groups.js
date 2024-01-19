const mongoose = require('../utils/mongoConnector');
const Group = require('../models/groups');
const Message = require('../models/messages');

const { validateRequest } = require('../utils/requestValidator');
const { validateArray } = require('../utils/objArrayValidator');

// create new group (add requesting user to the group)
const newGroup = (req, res) => {
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
            let isChatroom = (memberSize === 1) ? false : true;

            let members = req.body.otherMembers;
            members.push({ id: req.user.id, name: req.user.name });

            let group = new Group({
                name: req.body.name,
                is_chatroom: isChatroom,
                members: members,
                description: req.body.desc,
            })

            group.save()
                .then(createdGroup => {
                    console.log('Group: ', createdGroup.name, 'created by User: ', req.user.name);
                    res.send({ status: 'success', groupId: createdGroup._id });
                })
                .catch(error => {
                    console.error('Error saving message:', error);
                    res.status(500).send({ status: 'failed' });
                });
        } else {
            res.status(400).send({ message: 'members not defined properly' });
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
    newGroup,
    showUserGroups,
    showChatroomGroups
}