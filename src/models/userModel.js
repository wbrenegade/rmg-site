const { randomUUID } = require("crypto");
const { readDb, writeDb } = require("./dbModel");

function findByEmail(email) {
  const db = readDb();
  return db.users.find((user) => user.email.toLowerCase() === String(email || "").toLowerCase()) || null;
}

function createUser({ name, email, password }) {
  const db = readDb();
  const user = {
    id: randomUUID(),
    name,
    email,
    password,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDb(db);
  return user;
}

function authenticateUser({ email, password }) {
  const db = readDb();
  return (
    db.users.find(
      (user) => user.email.toLowerCase() === String(email || "").toLowerCase() && user.password === password
    ) || null
  );
}

module.exports = {
  findByEmail,
  createUser,
  authenticateUser
};
