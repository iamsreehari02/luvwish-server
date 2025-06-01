export const authenticateUser = (req, res, next) => {
  const token = req.cookies?.authToken;

  if (!token) return res.status(401).json({ error: "No token provided" });

  console.log("token in cookies", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};
