import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import cookieParser from "cookie-parser";
import routes from "./src/routes/index.js";
import corsOptions from "./src/config/cors.js";

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));

app.use("/api", routes);

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
