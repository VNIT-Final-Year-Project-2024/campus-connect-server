const mongoose = require('../utils/mongoConnector');
const Message = require('../models/messages');
const Group = require('../models/groups');
const { validateRequest } = require('../utils/requestValidator');
const { sendUpdateToGroup } = require('../socketApp');

// send message into a group
const sendMessage = (req, res) => {

  // validate request body
  let requiredFields = ['groupId', 'content'];

  if (validateRequest(req, res, requiredFields)) {
    if (req.body.content === null || req.body.content.trim() === "") {
      res.status(400).send({ message: 'message cannot be empty' });
      return;
    }

    let groupId = req.body.groupId;

    // check membership of user against the provided group
    Group.findById(groupId).then(group => {

      if (!group) {
        console.error('Group not found');
        res.status(404).send({ message: 'group does not exist' });
        return;
      }

      if (group.members.some(member => member.id === req.user.id)) {
        let message = new Message({
          group_id: groupId,
          sender: {
            id: req.user.id,
            name: req.user.name
          },
          content: req.body.content
        });

        message.save()
          .then(savedMessage => {
            let msgUpdate = {
              messageId: savedMessage.id,
              sender: savedMessage.sender,
              content: savedMessage.content,
              timestamp: savedMessage.timestamp
            };

            // update the group's recent activity
            group.recent_activity.message = savedMessage.id;
            group.recent_activity.timestamp = savedMessage.timestamp;

            group.save()
              .then(updatedGroup => {
                console.log('Recent message updated for group:', updatedGroup.id);
              })
              .catch(error => {
                console.error('Error updating recent message for group:', error);
                res.status(500).send({ status: 'failed' });
                return;
              });

            sendUpdateToGroup(req.body.groupId, msgUpdate);
            console.log('Message from user:', savedMessage.sender.name, 'sent:', `"${savedMessage.content}"`, 'to group:', groupId);
            res.send({ status: 'success' });
          })
          .catch(error => {
            console.error('Error saving message:', error);
            res.status(500).send({ status: 'failed' });
          });

      } else {
        res.status(403).send({ message: 'not a member of the provided group' });
      }

    }).catch(error => {
      console.error('Error getting details of group:', error);
      res.status(500).send('Internal server error');
      return;
    });
  }
}

// view messages from a group
const viewMessages = async (req, res) => {

  // validate request query params
  const requiredParams = ['groupId'];

  if (validateQueryParams(req, res, requiredParams)) {

    let pageSize = 10;                                               // page size for messages
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
  }
}

module.exports = {
  sendMessage, viewMessages
}