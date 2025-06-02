import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  const token = req.cookies?.authToken;

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.log("JWT error:", err.message);
    res.status(403).json({ error: "Invalid token" });
  }
};
