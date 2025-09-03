import cors from "cors";
import express from "express";
import adminListingRouter from "./routes/adminListings.ts";

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Monter le routeur sous /admin/listings
app.use("/admin/listings", adminListingRouter);

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
