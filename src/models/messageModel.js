const { randomUUID } = require("crypto");
const { readDb, writeDb } = require("./dbModel");

function getAllMessages() {
  const db = readDb();
  return db.messages;
}

function createMessage({ name, email, phone, subject, message }) {
  const db = readDb();
  const savedMessage = {
    id: randomUUID(),
    name,
    email,
    phone: phone || "",
    subject,
    message,
    createdAt: new Date().toISOString()
  };

  db.messages.unshift(savedMessage);
  writeDb(db);
  return savedMessage;
}

module.exports = {
  getAllMessages,
  createMessage
};
