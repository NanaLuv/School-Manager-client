// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const authenticateToken = (req, res, next) => {


  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "No authorization header",
    });
  }

  const token = authHeader && authHeader.split(" ")[1]; // Expecting "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied. Please login first.",
    });
  }

  try {
    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request object
    user = req.user = {
      id: verified.id,
      username: verified.username,
      role: verified.role,
      role_id: verified.role_id,
    };

    next(); // Continue to the next middleware or route handler
  } catch (error) {
    console.error("Token verification error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Session expired. Please login again.",
      });
    }

    return res.status(403).json({
      success: false,
      error: "Invalid token. Please login again.",
    });
  }
};;

// Check if user has the required role(s)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Make sure we have user data from authenticateToken
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }


    // Check if user's role_id is in the allowed roles list
    const userRoleId = req.user.role_id;


    if (!allowedRoles.includes(userRoleId)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. You need ${allowedRoles
          .map((id) => {
            if (id === 1) return "admin";
            if (id === 2) return "teacher";
            if (id === 3) return "student";
            if (id === 4) return "accountant";
            return "higher privileges";
          })
          .join(" or ")} access for this.`,
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
