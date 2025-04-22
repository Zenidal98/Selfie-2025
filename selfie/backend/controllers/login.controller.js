import Register from "../models/register.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await Register.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: "Utente non trovato" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Password errata" });
    }

    // questo è il token jwt che contiene tutti i campi che poi ci serviranno nella home. Cosi non uso piu local storage
    const payload = {
      id: user._id,
      nome: user.nome,
      cognome: user.cognome,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "3h" });

    res.status(200).json({
      success: true,
      token,      // quello che usiamo poi nel frontend
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Errore server" });
  }
};
