const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const dontenv = require('dotenv')
const cors = require("cors")
const { MongoClient, ServerApiVersion } = require('mongodb');
dontenv.config();
const uri = process.env.MONGODB_URI

const app = express()
const PORT = process.env.PORT
app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {

    await client.connect();

    const db = client.db("b13-assignment")
    const carCollection = db.collection("carListeds")
    app.get('/addCar', async (req, res) => {
      const result = await carCollection.find().toArray()
      res.json(result)
    })

    app.post("/addCar", async (req, res) => {
      const addCarData = req.body
      console.log(addCarData)
      const result = await carCollection.insertOne(addCarData)
      
      res.send({
        success: true,
        insertedId: result.insertedId
      });
    })
    



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running fine ! ')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})