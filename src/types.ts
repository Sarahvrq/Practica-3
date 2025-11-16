import { ObjectId } from "mongodb";

export type User = {
  _id?: ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export type Product = {
  _id?: ObjectId;
  name: string;
  description?: string;
  price: number;
  stock: number;
  createdAt: Date;
};

export type CartItem = {
  productId: ObjectId;
  quantity: number;
};

export type Cart = {
  _id?: ObjectId;
  userId: ObjectId;
  items: CartItem[];
};
