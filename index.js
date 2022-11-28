const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const app = express();
const port = process.env.PORT || 5000;

//middle wares 

app.use(cors());
app.use(express.json());


//database connection



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hgitfpl.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const servicesCollection = client.db('Mobel').collection('services');
        const catagoriesCollection = client.db('Mobel').collection('catagories');
        const bookingsCollection = client.db('Mobel').collection('bookings');
        const usersCollection = client.db('Mobel').collection('users');
        const advertiseCollection = client.db('Mobel').collection('advertise');
        const paymentsCollection = client.db('Mobel').collection('payments');

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        //specific service

        // app.get('/services/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const service = await servicesCollection.findOne(query);
        //     res.send(service);

        // });

        //specefic catagories

        app.get('/catagories/:name', async (req, res) => {
            const name = req.params.name;
            const query = { catagory_name: (name) };
            const category = await catagoriesCollection.find(query).toArray();
            res.send(category);

        });

        //get your booking with your specific email
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { email: email };
            const allbookings = await bookingsCollection.find(query).toArray();
            res.send(allbookings);
        });


        //get your bookings data with specific id

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const bookingid = await bookingsCollection.findOne(query);
            res.send(bookingid);

        });

        //post bookings data

        app.post('/bookings', async (req, res) => {
            const booking = req.body;

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        //advertise post
        app.post('/catagories', async (req, res) => {
            const advertise = req.body;

            const result = await catagoriesCollection.insertOne(advertise);
            res.send(result);
        });

        //get all advertise

        app.get('/catagories', async (req, res) => {
            const query = {}
            const cursor = catagoriesCollection.find(query);
            const advertises = await cursor.toArray();
            res.send(advertises);
        });



        // get your all users
        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = usersCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        });


        //specific user using email(dashboardlayout)
        app.get('/users', async (req, res) => {
            const email = req.query.email;

            const query = { email: email };
            const useremail = await usersCollection.find(query).toArray();
            res.send(useremail);

        });


        //specific user

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const admincheck = await usersCollection.findOne(query);
            res.send({ isAdmin: admincheck?.role === 'admin' });

        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        //Admin role

        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        //delete user

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        //delete orders

        app.delete('/bookings/:id', async (req, res) => {
            const orderid = req.params.id;
            const filter = { _id: ObjectId(orderid) };
            const result = await bookingsCollection.deleteOne(filter);
            res.send(result);
        });

        //payment service
        app.post("/create-payment-intent", async (req, res) => {
            const bookingpayment = req.body;
            const price = bookingpayment.productPrice;
            const amount = price * 100;

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


        //post your updated payment info

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc);

            res.send(result);

        })



    }
    finally {

    }
}

run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('Mobel server is running');
})

app.listen(port, () => {
    console.log(`Mobel server running on ${port} `);
})
