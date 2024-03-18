// Role Based Access Control (RBAC) Permits

const permits = {
    SEND_MESSAGE: 1,
    UPDATE_GROUP_DETAILS: 2,
    ADD_GROUP_MEMBER: 4,
    CREATE_GROUP: 8,
    DELETE_GROUP: 16,
    UPDATE_CLUB_DETAILS: 32,
    ADD_CLUB_MEMBER: 64,
    DELETE_CLUB: 128
};

module.exports = permits;