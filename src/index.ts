import express from "express";
import dotenv from "dotenv";
import { connectMongoDB } from "./mongo";
import rutasAuth from "./routes/auth";
import rutasCart from "./routes/cart";
import rutasProducts from "./routes/products";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);

const app = express();

app.use(express.json());
app.use("/api/auth", rutasAuth);
app.use("/api/cart", rutasCart);
app.use("/api/products", rutasProducts);

connectMongoDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("No se pudo iniciar la API:", error);
    process.exit(1);
  });
