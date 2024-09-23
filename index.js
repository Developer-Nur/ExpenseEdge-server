require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection using mongoose (no deprecated options)
mongoose.connect(process.env.URI)
    .then(() => console.log("Connected to DB!"))
    .catch(err => console.error("DB connection error:", err));

// Define mongoose schema and models
const companySchema = new mongoose.Schema({
    name: String,
    revenue: Number,
    // Add other fields as necessary
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    // Add other fields as necessary
});

// Create models based on the schemas
const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);

// Example route to fetch companies
app.get('/companies', async (req, res) => {
    try {
        const companies = await Company.find();  // Fetch all companies
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Example route to fetch users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();  // Fetch all users
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(port, () => {
    console.log("Server is running at port", port);
});


