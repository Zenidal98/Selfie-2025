import jwt from "jsonwebtoken";

/**
 * Auth middleware
 * - Accepts "Authorization: Bearer <token>" OR a "token" cookie (optional).
 * - Exposes req.user = { id, nome, cognome, username } from your JWT payload.
 */
export function auth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const bearer = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    const cookieToken = req.cookies?.token; // if you later set it as an HTTP-only cookie
    const token = bearer || cookieToken;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Your login controller signs { id, nome, cognome, username }
    const { id, nome, cognome, username } = decoded || {};
    if (!id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = { id, nome, cognome, username };
    next();
  } catch (err) {
    // Token expired or invalid
    const msg =
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ error: msg });
  }
}
