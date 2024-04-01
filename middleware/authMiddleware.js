// middleware/authMiddleware.js
const firebase = require("../firebase");

async function authMiddleware(req, res, next) {
  const idToken = req.headers.authorization; // Assuming token is passed in the Authorization header

  try {
    const decodedToken = await firebase.verifyFirebaseToken(idToken);
    req.user = decodedToken; // Attach decoded token to request object for use in route handlers
    next(); // Call next to proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = authMiddleware;
