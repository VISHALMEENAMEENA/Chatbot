const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Just attach the decoded user (without querying DB)
    req.user = decoded.user; // assuming you set it as { user: { id, role } }

    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
