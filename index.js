const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


//Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

console.log(process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bgilkf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
      await client.connect();

      const ServiceCollection = client.db('carDoctor').collection('Services');
    const BookingCollection = client.db('carDoctor').collection('bookings');
    
    // Auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'})
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false, //http://localhst:5274/login
          // sameSite: 'none'
        })
        .send({success: true});
    })

    // services related api
      app.get('/Services', async (req, res) => {
          const cursor = ServiceCollection.find();
          const result = await cursor.toArray();
          res.send(result);
      })
    
    app.get('/Services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      
      const options = {
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };

      const result = await ServiceCollection.findOne(query,options);
      res.send(result);
    })
    
    // bookings
    app.get('/bookings', async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query?.email) {
        query={email: req.query.email}
      }
      const result = await BookingCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking);

      const result = await BookingCollection.insertOne(booking);
      res.send(result);
    });

    // delete bookings 
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await BookingCollection.deleteOne(query);
      res.send(result);
    })
    // bookings updated
    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateBookings = req.body;
      console.log(updateBookings);

     const updateDoc = {
        $set: {
          status:updateBookings.status
        },
      }
      const result = await BookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
      


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('doctor is running')
})

app.listen(port, () => {
    console.log(`Car Doctor server is running ${port}`);
})
