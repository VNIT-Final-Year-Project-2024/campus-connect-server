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

const viewMessages = async (req, res) => {

  // validate request body
  let requiredFields = ['groupId', 'page'];

  if (validateRequest(req, res, requiredFields)) {

    let pageSize = 10;
    let pageNumber = parseInt(req.body.page);

    if(pageNumber < 1) {
      res.status(400).send({ message: 'page cannot be less than 1' });
      return;
    }

    try {
      const messages = await Message.find({ group_id: req.body.groupId })
        .sort({ timestamp: -1 })
        .skip(pageSize * (pageNumber - 1))
        .limit(pageSize);

      if (messages.length === 0) {
        res.status(200).json({ status: 'empty' });
      } else {
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