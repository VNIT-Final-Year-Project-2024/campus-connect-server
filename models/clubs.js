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
            id: int,
            name: String
        },
        user: {
            id: int,
            name: String,
        }
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Club = mongoose.model('Club', clubSchema);

module.exports = Club;