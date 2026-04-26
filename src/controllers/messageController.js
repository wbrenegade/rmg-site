const { createMessage } = require("../models/messageModel");

function createNewMessage(req, res) {
  const { name, email, phone, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "Name, email, subject, and message are required." });
    return;
  }

  const savedMessage = createMessage({ name, email, phone, subject, message });
  res.status(201).json(savedMessage);
}

module.exports = {
  createNewMessage
};
