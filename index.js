require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

        // get date
        function getCurrentDate() {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-based
            const dd = String(today.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
        
        // middlewere to verify jwt token
        const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers);

            if (!req.headers.authorization) {
                // console.log(" data update in company", req.headers.authorization);
                return res.status(400).send({ message: 'forbidden access' });
            }

            const token = req.headers.authorization.split(' ')[1];
            // console.log("the token", token);
            jwt.verify(token, process.env.Access_Secret_Token, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'forbidden access' });
                }
                req.decoded = decoded;
                next();
            });
        };

        // jwt related api
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.Access_Secret_Token, { expiresIn: '2h' });
            // console.log("jwt email is", user, "and token is ", token);
            res.send({ token })
        })

        // Route to fetch all companies
        app.get('/companies', verifyToken, async (req, res) => {
            try {
                // console.log("token from local storage", req.headers);
                const companies = await companiesCollection.find().toArray();
                res.json(companies);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // Route to fetch all users
        app.get('/users', verifyToken, async (req, res) => {
            try {
                const users = await usersCollection.find().toArray();
                res.json(users);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const result = await usersCollection.findOne({ email })
            res.send(result)
        })

        // get company data
        app.get('/single-company/:companyName', async (req, res) => {
            try {
                const companyName = req.params.companyName;
                const result = await companiesCollection.findOne({ companyName: companyName });
                if (!result) {
                    return res.status(404).json({ message: 'Company not found' });
                }
                res.json(result);
            } catch (error) {
                console.error('Error fetching company data:', error); // Log error for debugging
                res.status(500).json({ message: 'Server error: ' + error.message }); // Return server error message
            }
        });

        // update company data
        app.put('/update-company-data/:id', async (req, res) => {
            const id = req.params.id;
            const query = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedQuery = {
                $set: {
                    "data.income": query.income,
                    "data.expense": query.expense,
                    "data.assets": query.assets,
                    "data.liabilities": query.liabilities,
                    "data.equity": query.equity
                }
            };
            const result = await companiesCollection.updateOne(filter, updatedQuery, options);
            res.send(result);
        });


        //  make admin api
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        // delete a user api
        app.delete('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });



        // delete a company api
        app.delete('/company/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await companiesCollection.deleteOne(query);
            res.send(result);
        });










        // add company financial data
        app.patch('/company/:email', verifyToken, async (req, res) => {
            try {
                const { income, expense, assets, liabilities, equity } = req.body;
                const email = req.params.email;

                const newIncomeExpenseEntry = {
                    date: getCurrentDate(),
                    income: parseFloat(income),
                    expense: parseFloat(expense),
                };

                const newBalanceData = [
                    { id: 3, title: "Assets", amount: parseFloat(assets) },
                    { id: 4, title: "Liabilities", amount: parseFloat(liabilities) },
                    { id: 5, title: "Equity", amount: parseFloat(equity) }
                ];

                const result = await companiesCollection.updateOne(
                    { email: email },
                    {
                        $push: { "data.incomeExpense": newIncomeExpenseEntry },
                        $set: { "data.balanceData": newBalanceData }
                    }
                );
                res.json(result);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const result = await usersCollection.findOne({ email })
            res.send(result)
        })

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
            // console.log("required email is", email);
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

        // Route to get users by name
        app.get('/users/:name', async (req, res) => {
            const companyName = req.params.name;
            try {
                const users = await usersCollection.find({ companyName: companyName }).toArray(); // Replace 'users' with your collection name
                if (users.length > 0) {
                    res.status(200).json(users);
                } else {
                    res.status(404).json({ message: "User not found" });
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ message: "Error fetching users" });
            }
        });

        // Route to approve a user by ID
        app.put('/users/:id/approve', verifyToken, async (req, res) => {
            const userId = req.params.id;
            try {
                const result = await db.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { $set: { righter: "approved" } }
                );

                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: "User approved successfully" });
                } else {
                    res.status(404).json({ message: "User not found" });
                }
            } catch (error) {
                console.error('Error approving user:', error);
                res.status(500).json({ message: "Error approving user" });
            }
        });

        // company data for company dashboard
        app.get('/company-info/:email', async (req, res) => {
            try {
                const email = req.params.email;
                if (!email) {
                    return res.status(400).json({ message: 'Email query parameter is missing' });
                }
                const result = await companiesCollection.findOne({ email: email });
                res.send(result.data);
            } catch (error) {
                res.status(500).json({ message: error.message });
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





