import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from './config/db.js';
import plutoRoutes from './routes/pluto.route.js';
import registerRoutes from './routes/register.route.js'
import loginRoutes from "./routes/login.route.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());

app.use("/api/plutos", plutoRoutes);

app.use("/api/register", registerRoutes);

app.use("/api/login", loginRoutes);

//console.log(process.env.MONGO_URI);

app.listen(PORT, () => {
    connectDB();
    console.log("Server attivato sulla porta " + PORT);
});


