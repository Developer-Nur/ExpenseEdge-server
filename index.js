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
        // console.log("is company inserted", result);
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
        console.log("is user inserted", result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to check both companies and users by email
app.get('/find-by-email', async (req, res) => {
    const { email } = req.query;

    try {
        // Check for the email in the users collection
        const user = await db.collection('users').findOne({ email });

        if (user) {
            return res.json('user');  // Send "user" as the response
        }

        // If not found in users, check in the companies collection
        const company = await db.collection('companies').findOne({ email });

        if (company) {
            return res.json('company');  // Send "company" as the response
        }

        // If not found in both collections
        return res.status(404).json({ message: 'User or Company not found' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


app.listen(port, () => {
    console.log("Server is running at port", port);
});




