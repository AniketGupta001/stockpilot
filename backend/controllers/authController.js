const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || password.length < 8)
      return res.status(400).json({ message: "Name, email and password (minimum 8 characters) are required" });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered. Please sign in." });
    const role = (await User.countDocuments()) === 0 ? "admin" : "staff";
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role });
    res.status(201).json({ message: "Account created", user: { id: user._id, name, email, role } });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "12h" });
    res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};