import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client: MongoClient;
let dB: Db;
const dbName = process.env.MONGO_DB_NAME ?? "Practica3";

export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUrl = process.env.MONGO_URI as string; //si no, no me funciona

    client = new MongoClient(mongoUrl);
    await client.connect();
    dB = client.db(dbName);
    console.log("Connected to mongodb at db " + dbName);
  } catch (error) {
    console.log("Error Mongo: ", error);
  }
};

export const getDb = (): Db => dB;
