const mongoose = require('../utils/mongoConnector');
const Message = require('../models/messages');
const { validateRequest } = require('../utils/requestValidator');

// send message into a group
const sendMessage = (req, res) => {

  // validate request body
  let requiredFields = ['groupId', 'content'];

  if (validateRequest(req, res, requiredFields)) {
    if (req.body.content === null || req.body.content.trim() === "") {
      res.status(400).send({ message: 'message cannot be empty' });
      return;
    }

    let message = new Message({
      group_id: req.body.groupId,
      sender: {
        id: req.user.id,
        name: req.user.name
      },
      content: req.body.content
    });

    message.save()
      .then(savedMessage => {
        console.log('Message from', savedMessage.sender.name, 'sent:', savedMessage.content);
        res.send({ status: 'success' });
      })
      .catch(error => {
        console.error('Error saving message:', error);
        res.status(500).send({ status: 'failed' });
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