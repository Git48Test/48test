const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const compression = require("compression");
const NodeCache = require("node-cache");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
require("dotenv").config();

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.id} died`);
    cluster.fork();
  });
} else {
  const app = express();
  app.use(express.json());
  app.use(compression());

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "test";
  const collectionName = process.env.COLLECTION_NAME || "users";
  const port = process.env.PORT || 3500;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  const userCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

  async function connectToMongo() {
    try {
      await client.connect();
      console.log("Connected to MongoDB");
      const collection = client.db(dbName).collection(collectionName);
      collection.createIndex({ username: 1 }); // Ensure index on username
    } catch (err) {
      console.error("Failed to connect to MongoDB", err);
      process.exit(1);
    }
  }

  app.post("/register", async (req, res) => {
    const { username, password, accountType } = req.body;

    if (!username || !password || !accountType) {
      return res
        .status(400)
        .send("Username, password, and account type are required");
    }

    try {
      const collection = client.db(dbName).collection(collectionName);
      const existingUser = await collection.findOne({ username });
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await collection.insertOne({
        username,
        password: hashedPassword,
        accountType,
      });

      res.status(201).send("User registered successfully");
    } catch (err) {
      console.error("Error in /register", err);
      res.status(500).send("Server error");
    }
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send("Username and password are required");
    }

    try {
      const collection = client.db(dbName).collection(collectionName);
      const user = await collection.findOne({ username });

      if (!user) {
        return res.status(400).send("User not found");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).send("Invalid password");
      }

      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username,
          accountType: user.accountType,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({
        token,
        accountType: user.accountType,
        message: "Logged in successfully",
      });
    } catch (err) {
      console.error("Error in /login", err);
      res.status(500).send("Server error");
    }
  });

  app.get("/admin", verifyToken, async (req, res) => {
    if (req.user.accountType !== "admin") {
      return res
        .status(403)
        .send("Access denied. Only admins can access this route.");
    }

    try {
      const collection = client.db(dbName).collection(collectionName);
      const users = await collection.find().toArray();
      res.json(users);
    } catch (err) {
      console.error("Error in /admin", err);
      res.status(500).send("Server error");
    }
  });

  function verifyToken(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(403).send("Access denied. No token provided.");
    }

    try {
      const token = bearerHeader.split(" ")[1]; // Bearer <token>
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(400).send("Invalid token");
    }
  }

  app.get("/some-protected-route", verifyToken, (req, res) => {
    res.send("Protected data");
  });

  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    connectToMongo();
  });
}
