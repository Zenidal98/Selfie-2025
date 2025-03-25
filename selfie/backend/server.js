import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from './config/db.js';
import plutoRoutes from './routes/pluto.route.js';

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/plutos", plutoRoutes);

//console.log(process.env.MONGO_URI);

app.listen(5000, () => {
    connectDB();
    console.log("Server attivato sulla porta 5000");
});


