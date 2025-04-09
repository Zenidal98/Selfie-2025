import mongoose from "mongoose";

const registerSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dataNascita: { type: Date },
  foto: { type: String } // magari il path o un link
}, { timestamps: true });

const Register = mongoose.model("Register", registerSchema);
export default Register;
