const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, maxlength: 30 },
  is_chatroom: { type: Boolean },
  members: [{ id: Number, name: String }],
  description: { type: String },
  recentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  avatar: { type: String },
  created_at: { type: Date, default: Date.now },
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;