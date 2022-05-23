// KFDV5UmJn9zoRgli
// electroma
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();

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

        app.get('/services', async (req, res) => {
            const result = await serviceCollection.find().toArray();
            res.send(result)
        })
        // load single service by id
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.findOne(query);
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