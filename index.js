// KFDV5UmJn9zoRgli
// electroma
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//middleware 
app.use(cors());
app.use(express.json());

// jwrverify function
function jwtVerify(req, res, next) {
    const authHeader = req.headers.authorization;


    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.APP_JWT, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden' })
        }
        req.decoded = decoded;
        console.log(decoded)
        next();
    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.APP_USER}:${process.env.APP_PASS}@cluster0.hkbp7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("electroma").collection("services");
        const orderCollection = client.db("electroma").collection("orders");
        const paymentCollection = client.db("electroma").collection("payments");
        const reviewCollection = client.db("electroma").collection("reviews");
        const userCollection = client.db("electroma").collection("users");


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

        //----------------------------------------------------------//
        //----------------------------------------------------------//
        //review collection//
        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result)
        })
        app.post('/review', async (req, res) => {
            const comment = req.body;
            const result = await reviewCollection.insertOne(comment);
            res.send(result)
        })



        //--------------------------------------------------------------//
        //---------------------------------------------------------------//
        // user collection

        //make admin api
        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // add user in database
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const userInfo = req.body;

            const filter = { email: userInfo.email }
            const option = { upsert: true };
            const updateDoc = {
                $set: userInfo,
            };
            const result = await userCollection.updateOne(filter, updateDoc, option);
            const token = jwt.sign({ email: email }, process.env.APP_JWT, { expiresIn: '1h' });
            res.send({ result, token });
        })
        // update user information
        app.patch('/user/update/:email', async (req, res) => {
            const email = req.params.email;
            const updateInfo = req.body.userProfileInfo;
            const filter = { email: email };

            const updateDoc = {
                $set: {
                    name: updateInfo.name,
                    address: updateInfo.address,
                    phone: updateInfo.phone,
                    education: updateInfo.education,
                    linkdin: updateInfo.linkdin
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc);
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