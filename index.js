require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());


async function run() {
    let client;
    try {
        // Connect the client to the server
        client = new MongoClient(process.env.URI);
        await client.connect();
        const db = client.db('expenseMaster');  // Use 'expenseMaster' as the database

        // Collections
        const companiesCollection = db.collection('companies');
        const usersCollection = db.collection('users');

        // Send a ping to confirm a successful connection
        await db.command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Route to fetch all companies
        app.get('/companies', async (req, res) => {
            try {
                const companies = await companiesCollection.find().toArray();
                res.json(companies);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // Route to fetch all users
        app.get('/users', async (req, res) => {
            try {
                const users = await usersCollection.find().toArray();
                res.json(users);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // get company data
        app.get('/company/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const result = await companiesCollection.findOne({email: email});
                res.send(result);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // add company financial data
        app.patch('/company/:email', async (req, res) => {
            try {
                const data = req.body;
                const email = req.params.email;
                const result = await companiesCollection.updateOne(
                    {email: email},
                    {
                        $set: {
                            data: data
                        }
                    }
                );
                res.json(result);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // Route to add a new company
        app.post('/companies', async (req, res) => {
            try {
                const newCompany = req.body;
                const result = await companiesCollection.insertOne(newCompany);
                res.json(result);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // Route to add a new user
        app.post('/users', async (req, res) => {
            try {
                const newUser = req.body;
                const result = await usersCollection.insertOne(newUser);
                res.json(result);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // updated joining request data to user collection

        app.put('/users/:email', async (req, res) => {
            const userEmail = req.params.email;
            const { companyName, righter } = req.body; 

            try {
                const result = await usersCollection.updateOne(
                    { email: userEmail },
                    {
                        $set: {
                            companyName: companyName,
                            righter: righter
                        }
                    }
                );

                if (result.matchedCount > 0) {
                    res.status(200).json({ message: 'User updated successfully' });
                } else {
                    res.status(404).json({ message: 'User not found' });
                }
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });



           


        // Route to check for email in both companies and users
        app.get('/find-by-email', async (req, res) => {
            const { email } = req.query;
            try {
                // Check users collection
                const user = await usersCollection.findOne({ email });
                if (user) return res.json('user');

                // Check companies collection
                const company = await companiesCollection.findOne({ email });
                if (company) return res.json('company');

                // If not found in both collections
                res.status(404).json({ message: 'User or Company not found' });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });



        app.put('/users/:id/approve', async (req, res) => {
            const userId = req.params.id;
            console.log(`Approving user with ID: ${userId}`);
        
            try {
                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(userId) },
                    { $set: { approved: true } }
                );
        
                if (result.matchedCount === 0) {
                    console.error('User not found');
                    return res.status(404).send({ message: 'User not found' });
                }
        
                res.status(200).send({ message: 'User approved successfully' });
            } catch (error) {
                console.error('Error approving user:', error);  // Log error for debugging
                res.status(500).send({ message: 'Internal server error' });
            }
        });
        





    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }


    // Start server only after MongoDB is connected
    app.listen(port, () => {
        console.log("Server is running at port", port);
    });
}
run().catch(console.dir);





