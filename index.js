// KFDV5UmJn9zoRgli
// electroma
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//middleware 
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.APP_USER}:${process.env.APP_PASS}@cluster0.hkbp7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("electroma").collection("services");
        const orderCollection = client.db("electroma").collection("orders");
        const paymentCollection = client.db("electroma").collection("payments");


        //----------------------------------------------------//
        //----------------------------------------------------//
        //Service Collection//

        app.get('/services', async (req, res) => {
            const result = await serviceCollection.find().toArray();
            res.send(result)
        })
        // get payment
        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.price;
            console.log(price)
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });
        //update service quantity api
        app.put('/services/:id', async (req, res) => {
            const id = req.params.id;
            const quantity = req.body.quantity;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    quantity: quantity
                }
            }
            const result = await serviceCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        // load single service by id
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result)
        })



        //------------------------------------------------------------------//
        //------------------------------------------------------------------//
        // Order collection//

        //-----------------------//
        //transaction api
        app.patch('/orderbooking/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,

                }
            }
            const updateOrder = await orderCollection.updateOne(filter, updateDoc);
            const paymentSummery = await paymentCollection.insertOne(payment);
            res.send(updateOrder)
        })

        // save order from user , create post api
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)

        })

        // get all order for user by email
        app.get('/order/:email', async (req, res) => {
            const email = req.params.email;
            const result = await orderCollection.find({ email: email }).toArray();
            res.send(result)
        })

        // delete Order api
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result)
        })

        //get single order by id
        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.findOne(query);
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('This server is running')
})
app.listen(port, () => {
    console.log('This server running :', port)
})