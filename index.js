const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const dontenv = require('dotenv')
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const { unescape } = require("node:querystring");
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


const JWXS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
)


const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token found" });
  }
  const token = authHeader.split(" ")[1]
  if (!token) {
    return res.status(401).json({ message: "No token found" });
  }
  try {
    const { payload } = await jwtVerify(token, JWXS)
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" })
  }


};


async function run() {
  try {

    await client.connect();

    const db = client.db("b13-assignment")
    const carCollection = db.collection("carListeds")

    const carBookingCollection = db.collection("carAndUserBooking")
    const carAddedCollection = db.collection("carAdded")




    app.get('/addCar', async (req, res) => {
      const result = await carCollection.find().toArray()
      res.json(result)
    })
    //middleware 

    app.get('/addCar/:id', verifyToken, async (req, res) => {
      const { id } = req.params
      const result = await carCollection.findOne({ _id: new ObjectId(id) })
      res.json(result)
    })

    app.patch('/addCar/:id', async (req, res) => {
      const { id } = req.params
      const updateData = req.body
      const result = carCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      res.json(result)
    });

    app.delete('/addCar/:id', async (req, res) => {
      const { id } = req.params;
      const result = await carCollection.deleteOne({ _id: new ObjectId(id) })
      res.json(result)
    })
    app.get('/booking/:userId', verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await carBookingCollection.find({ userId: userId }).toArray()
      res.json(result)
    })

    app.delete('/booking/:bookingId', async (req, res) => {
      const { bookingId } = req.params;
      const result = await carBookingCollection.deleteOne({ _id: new ObjectId(bookingId) })
      res.json(result)
    })

    app.delete('/added/:addedId', async (req, res) => {
      const { addedId } = req.params;
      const result = await carAddedCollection.deleteOne({ _id: new ObjectId(addedId) })
      res.json(result)
    })

    app.get('/added/:userId', verifyToken, async (req, res) => {
      const { userId } = req.params;

      const result = await carAddedCollection.find({ userId: userId }).toArray()
      res.json(result)
    })

    app.post('/addedData', verifyToken, async (req, res) => {
      const added = req.body
      const result = await carAddedCollection.insertOne(added)
      return res.json(result)
    })

    // app.post('/booking', verifyToken, async (req, res) => {
    //   const bookingData = req.body
    //   const result = await carBookingCollection.insertOne(bookingData)
    //   return res.json(result)
    // })

    app.post('/booking', verifyToken, async (req, res) => {
      const bookingData = req.body;

      const result = await carBookingCollection.insertOne(bookingData);

      const updateResult = await carCollection.updateOne(
        { _id: new ObjectId(bookingData.carId) },
        { $inc: { booking_count: 1 } }           
      );

      return res.json(result);
    });


    app.post("/addCar", verifyToken, async (req, res) => {
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