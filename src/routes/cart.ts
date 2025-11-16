import { Router, type Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../mongo";
import { verifyToken, type AuthRequest } from "../middleware/verifyToken";
import type { Cart, Product } from "../types";

const router = Router();

const cartsCollection = () => getDb().collection<Cart>("carts");
const productsCollection = () => getDb().collection<Product>("products");

const getUserId = (req: AuthRequest): string | null => {
  const payload = req.user;
  if (payload && typeof payload === "object" && "id" in payload) {
    const id = (payload as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

// PUT /add
router.put("/add", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity } = (req.body) as {
      productId?: string;
      quantity?: number;
    };

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: "productId y cantidad son requeridos" });
    }

    if (typeof productId !== "string") {
      return res.status(400).json({ message: "productId debe ser string" });
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "cantidad debe ser un entero mayor que 0" });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    if (!ObjectId.isValid(productId)) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const productObjectId = new ObjectId(productId);
    const product = await productsCollection().findOne({ _id: productObjectId });

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const userObjectId = new ObjectId(userId);
    const carts = cartsCollection();
    const existingCart = await carts.findOne({ userId: userObjectId });

    let updatedCart: Cart;
    
    if (!existingCart) {

      if (product.stock < quantity) {
        return res.status(400).json({ message: "Stock insuficiente" });
      }
      updatedCart = {
        userId: userObjectId,
        items: [{ productId: productObjectId, quantity }],
      };
      const insertResult = await carts.insertOne(updatedCart);
      updatedCart._id = insertResult.insertedId;
    } else {

      const items = [...existingCart.items];
      const index = items.findIndex((item) => item.productId.equals(productObjectId));

      if (index === -1) {
        if (product.stock < quantity) {
          return res.status(400).json({ message: "Stock insuficiente" });
        }
        items.push({ productId: productObjectId, quantity });
      } else {
        const newQuantity = items[index].quantity + quantity;
        if (newQuantity > product.stock) {
          return res.status(400).json({ message: "Stock insuficiente" });
        }
        items[index].quantity = newQuantity;
      }

      updatedCart = {
        _id: existingCart._id,
        userId: existingCart.userId,
        items,
      };

      await carts.updateOne({ _id: existingCart._id }, { $set: { items } });
    }

    return res.status(200).json(updatedCart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error de servidor" });
  }
});

// GET /cart
router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const userObjectId = new ObjectId(userId);
    const cart = await cartsCollection().findOne({ userId: userObjectId });

    if (!cart) {
      return res.status(200).json({
        userId: userObjectId,
        items: [],
      });
    }

    return res.status(200).json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error de servidor" });
  }
});

export default router;
