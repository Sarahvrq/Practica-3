import { Router, type NextFunction, type Response } from "express";
import { getDb } from "../mongo";
import { verifyToken, type AuthRequest } from "../middleware/verifyToken";
import type { Product } from "../types";

const productsCollection = () => getDb().collection<Product>("products");
const router = Router();

// GET /products
router.get("/", async (_req, res: Response, next: NextFunction) => {
  try {
    const products = await productsCollection().find().toArray();
    res.status(200).json(
      products.map((product) => ({
        _id: product._id?.toHexString(),
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        createdAt: product.createdAt,
      })),
    );
  } catch (error) {
    next(error);
  }
});

// POST /products
router.post("/", verifyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, stock } = req.body ?? {};

    if (typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ message: "El nombre del producto es obligatorio" });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ message: "La descripción debe ser texto" });
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: "El precio debe ser un número mayor que 0" });
    }

    if (typeof stock !== "number" || !Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return res.status(400).json({ message: "El stock debe ser un entero mayor o igual que 0" });
    }

    const now = new Date();
    const product: Product = {
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : undefined,
      price: Math.round(price * 100) / 100,
      stock,
      createdAt: now,
    };
    const insertResult = await productsCollection().insertOne(product);

    res.status(201).json({
      _id: insertResult.insertedId.toHexString(),
      ...product,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
