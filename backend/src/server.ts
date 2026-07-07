import express from "express";
import cors from "cors";
import extractRouter from "./routes/extract.route";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", extractRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
