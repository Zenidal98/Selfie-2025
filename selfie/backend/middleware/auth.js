import jwt from "jsonwebtoken";

// file extra creato per risolvere il problema del database condiviso 

// il middleware per passare il token JWT mette nell’header HTTP Authorization un Bearer <token>
// dopo la verifica del token, il middleware prende i dati salvati dentro il JWT (id, nome, cognome, username) e li mette in req.user.
// così i controller possono direttamente usare req.user senza dover decodificare di nuovo il token.
 
export function auth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const bearer = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    const cookieToken = req.cookies?.token; // nel caso vogliamo farlo come cookie http
    const token = bearer || cookieToken;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ciò che viene poi usato in login controller { id, nome, cognome, username }
    const { id, nome, cognome, username } = decoded || {};
    if (!id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = { id, nome, cognome, username };
    next();
  } catch (err) {
    // caso token scaduto o invalido
    const msg =
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ error: msg });
  }
}
