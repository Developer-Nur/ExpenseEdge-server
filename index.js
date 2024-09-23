require('dotenv').config()
const express = require('express');
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000;
const mongoose = require('mongoose');


// middlewires
app.use(cors())
app.use(express.json())

//db
mongoose.connect(process.env.URI).then(() => console.log("Connected to DB!"))



const companyCollection = client.db("expenseMaster").collection("Company");
const userCollection = client.db("expenseMaster").collection("User");


app.listen(port, () => {
    console.log("running at", port);
})
