const { findByEmail, createUser, authenticateUser } = require("../models/userModel");

function signup(req, res) {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }

  const exists = findByEmail(email);
  if (exists) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const user = createUser({ name, email, password });
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
}

function login(req, res) {
  const { email, password } = req.body || {};
  const user = authenticateUser({ email, password });

  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  res.json({ id: user.id, name: user.name, email: user.email });
}

module.exports = {
  signup,
  login
};
