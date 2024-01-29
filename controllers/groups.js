const mongoose = require('../utils/mongoConnector');
const Group = require('../models/groups');

const { validateRequest } = require('../utils/requestValidator');
const { validateArray } = require('../utils/objArrayValidator');

const fetchApiPageSize = 20;

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
                    res.status(409).send({ message: 'user group already exists', groupId: groups[0].id });
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
    let userId = req.user.id;

    try {
        // find groups that match members.id with the user's id and is_chatroom is false
        const matchingGroupsPipeline = [
            {
                $match: {
                    'members.id': userId,
                    is_chatroom: false
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
                $match: {
                    recent_activity: { $exists: true }
                }
            },
            {
                $sort: { "recent_activity.timestamp": -1 }
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
            const { id: otherUserId, name: otherUserName } = matchingGroup.members.find(member => member.id !== req.user.id);
            const avatar = matchingGroup.avatar;
            const recentActivity = matchingGroup.recent_activity;

            const { _id, sender, content, timestamp } = recentActivity;
            return {
                groupId: group_id,
                user: {
                    id: otherUserId,
                    name: otherUserName
                },
                recentMessage: {
                    messageId: _id.toString(),
                    sender: sender,
                    content: content,
                    timestamp: timestamp
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
    let userId = req.user.id;

    try {
        // find groups that match members.id with user's id, sort by recent_activity timestamp or created_at
        const matchingGroupsPipeline = [
            {
                $match: {
                    'members.id': userId,
                    is_chatroom: true
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
};


// search user groups for a user based on string provided
const searchUserGroups = async (req, res) => {

    // validate request query params
    const requiredParams = ['string'];

    if (validateQueryParams(req, res, requiredParams)) {

        let searchString = req.query.string;

        let timestamp = new Date(req.timestamp);
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
                    $match: {
                        recent_activity: { $exists: true }
                    }
                },
                {
                    $sort: { "recent_activity.timestamp": -1 }
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

                const { _id, sender, content, timestamp } = recentActivity;
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
        let userId = req.user.id;

        try {
            // find groups that match members.id with the user's id, is_chatroom is true, and group's name contains searchString
            const matchingGroupsPipeline = [
                {
                    $match: {
                        'members.id': userId,
                        is_chatroom: true,
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

// fetch chatroom group details for a user based on group id provided
const fetchChatroomInfo = async (req, res) => {

    // validate request query params
    const requiredParams = ['id'];

    if (validateQueryParams(req, res, requiredParams)) {

        let groupId = req.query.id;

        // check if the provided groupId is a valid
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).send({ error: 'invalid group ID provided' });
        }

        console.log(groupId);

        try {
            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(404).send({ error: 'group not found' });
            }

            // check if the user is a member of the group
            const isMember = group.members.some(member => member.id === req.user.id);

            if (!isMember) {
                return res.status(403).send({ message: 'not a member of the group' });
            }

            let { name, description, members, avatar, created_at } = group;

            // mapping the results to a simplified JSON format
            const groupInfo = {
                name, description, members, avatar, created_at
            };

            return res.status(200).json(groupInfo);

        } catch (error) {
            console.error('Error while fetching group:', err);
            return res.status(500).send('Internal server error');
        }
    }
};

module.exports = {
    newUserGroup, newChatroomGroup,
    showUserGroups, showChatroomGroups,
    searchUserGroups, searchChatroomGroups,
    fetchChatroomInfo
}