const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, maxlength: 30, required: true },
  is_chatroom: { type: Boolean },
  members: [{ id: Number, name: String }],
  description: { type: String, required: true },
  avatar: { type: String },
  created_at: { type: Date, default: Date.now },
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;