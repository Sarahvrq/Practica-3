import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getDb } from "../mongo";
import type { User } from "../types";

dotenv.config();

const router = Router();
const SECRET = process.env.SECRET ?? "";
const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usersCollection = () => getDb().collection<User>("users");

// GET /auth
router.get("/", (_req, res) => {
  res.send("Ruta auth disponible");
});

// POST /register 
router.post("/register", async (req, res) => {
  try {
    const { email, password, username } = (req.body ?? {}) as Partial<User> & { password?: string };

    if (typeof email !== "string" || !formatoEmail.test(email)) {
      return res.status(400).json({ message: "email debe ser válido" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "password debe tener al menos 6 caracteres" });
    }
    if (typeof username !== "string" || username.trim().length === 0) {
      return res.status(400).json({ message: "username es requerido" });
    }

    const users = usersCollection();
    const exists = await users.findOne({ email: email!.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Un usuario con ese email ya existe" });
    }

    const passwordHash = await bcrypt.hash(password!, 10);
    await users.insertOne({
      email: email!.toLowerCase(),
      passwordHash,
      username: username!.trim(),
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error interno", error });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };

    if (typeof email !== "string" || !formatoEmail.test(email)) {
      return res.status(400).json({ message: "email debe ser válido" });
    }
    if (typeof password !== "string" || password.length === 0) {
      return res.status(400).json({ message: "password es requerido" });
    }

    const users = usersCollection();
    const user = await users.findOne({ email: email!.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "email incorrecto" });
    }

    const isValid = await bcrypt.compare(password!, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ message: "contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user._id?.toString(), email: user.email },
      SECRET,
      { expiresIn: "1h" },
    );

    res.status(200).json({ message: { email: user.email, token: `Bearer ${token}` } });
  } catch (error) {
    res.status(500).json({ message: "Error interno", error });
  }
});

export default router;
