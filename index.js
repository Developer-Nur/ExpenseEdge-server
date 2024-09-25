require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection using MongoClient without deprecated options
const client = new MongoClient(process.env.URI);
let db;  // Global variable to store the database instance

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    db = client.db();  // Assign the connected database to the global variable

    // Send a ping to confirm a successful connection
    await db.command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
run().catch(console.dir);

// Example route to fetch companies
app.get('/companies', async (req, res) => {
    try {
        const companies = await db.collection('companies').find().toArray();  // Fetch all companies
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Example route to fetch users
app.get('/users', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();  // Fetch all users
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Example of adding a new company (POST route)
app.post('/companies', async (req, res) => {
    try {
        const newCompany = req.body;
        const result = await db.collection('companies').insertOne(newCompany);  // Insert a new company
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Example of adding a new user (POST route)
app.post('/users', async (req, res) => {
    try {
        const newUser = req.body;
        const result = await db.collection('users').insertOne(newUser);  // Insert a new user
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(port, () => {
    console.log("Server is running at port", port);
});




