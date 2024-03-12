const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        maxlength: 30,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    members: [{
        role: {
            id: Number,
            name: String
        },
        user: {
            id: Number,
            name: String,
        }
    }],
    group_ids: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true
        }
    ],
    created_at: {
        type: Date,
        default: Date.now
    },
    created_by: {
        id: Number,
        name: String,
    }
});

const Club = mongoose.model('Club', clubSchema);

module.exports = Club;