const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json("Token is not valid");
      req.user = user;
      next();
    });
  } else {
    res.status(401).json("You are not authenticated.");
  }
};

const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    const adminRoles = ["admin", "superAdmin", "regional", "national"];
    if (adminRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json("You are not admin.");
    }
  });
};

const verifyTokenAndSuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "superAdmin") {
      next();
    } else {
      res.status(403).json("You are not super admin.");
    }
  });
};

module.exports = {verifyTokenAndAuthorization, verifyToken, verifyTokenAndSuperAdmin}
