const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware // 
app.use(cors({
  origin : [
    
    'http://localhost:5173',

],
  credentials:true
}));

app.use(express.json());
app.use(cookieParser());
// middleware // 


// mongodb(database) //

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wslenxe.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if(!token){
    return res.status(401).send({message : 'unauthorized access'})
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message : 'unauthorized access'})
    }
    req.user = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    
    // database and collection //
    const booksCategoryCollection = client.db('libraryManagement').collection('booksCategory');

    const booksCollection = client.db('libraryManagement').collection('books');

    const borrowedBooksCollection = client.db('libraryManagement').collection('borrowedBook');
    // database and collection //

    
    // crud operation //

    // auth related api //
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {expiresIn: '2h'});
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite : 'none'
      })
      .send({success : true});
    })

    app.post('/logout', async(req, res) => {
      const user = req.body;
      console.log('logging out' , user);
      res
      .clearCookie('token', {maxAge: 0})
      .send({success: true})
    })
    // auth related api //

    // post books //
    app.post('/books', verifyToken, async(req, res) => {
        const addBooks = req.body;
        const result = await booksCollection.insertOne(addBooks);
        res.send(result);
      })
    // post books //

    // get booksCategory // 
    app.get('/booksCategory', async(req, res) => {
        const cursor = booksCategoryCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    // get booksCategory // 

    // get all books //
    app.get('/allBooks', verifyToken, async(req, res) => {
      console.log('cookie', req.cookies);
      const allBooks = booksCollection.find();
      const result = await allBooks.toArray();
      res.send(result);
    })
    // get all books //

    app.get('/filterBooks', verifyToken, async(req, res) => {
      console.log('cookie', req.cookies);
      const filterBook = booksCollection.find({quantity : {$ne: 0}});
      const result = await filterBook.toArray();
      res.send(result)
    })


    // update book //
    app.put('/books/:id', async(req, res) => {
      const updateBook = req.body;
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const options = { upsert: true };
      const updatedBook = {
        $set: {
          image : updateBook.image,
          name : updateBook.name,
          author : updateBook.author,
          category : updateBook.category,
          rating : updateBook.rating
        }
      }

      const result = await booksCollection.updateOne(filter, updatedBook, options);
      res.send(result);
    })
    // update book //

    // get all books by category wise //
    app.get('/books/:category', async(req, res) => {
        const category = req.params.category;
        const cursor = booksCollection.find({category : category});
        const result = await cursor.toArray();
        res.send(result);
    })
   // get all books by category wise //

  // get a single book by id //
   app.get('/singleBook/:id', async(req, res) => {
     const singleBooks = req.params.id;
     const query = {_id : new ObjectId(singleBooks)};
     const result = await booksCollection.findOne(query);
     res.send(result);
   })
  // get a single book by id //


  // post borrowed books //
   app.post('/borrowedBook', async(req, res) => {
     const borrowedBooks = req.body;
     const result = await borrowedBooksCollection.insertOne(borrowedBooks);
     res.send(result);
   })
  // post borrowed books //

  // update books quantity //
   app.put('/borrowedBook/:id', async(req, res) => {
    const updateQuantity = req.body;
    const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const options = { upsert: true };
      const updatedQuantity = {
        $set: {
          quantity : updateQuantity.quantity
        }
      }
      const result = await booksCollection.updateOne(filter, updatedQuantity, options)
      res.send(result);
   })
  // update books quantity //

  // get data by user email //
  app.get('/borrowedBook', async(req, res) => {
    let query = {};
    if(req.query?.email){
      query = {email : req.query.email}
    }
    const result = await borrowedBooksCollection.find(query).toArray();
    res.send(result);
  })
  // get data by user email //

  // remove borrowed book //
  app.delete('/removeBook/:id', async(req, res) => {
    const id = req.params.id;
    const query = {_id : new ObjectId(id)};
    const result = borrowedBooksCollection.deleteOne(query);
    res.send(result);
  })
  // remove borrowed book //

    // crud operation //


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// mongodb(database) //

app.get('/', (req, res) => {
  res.send('Library management server is running')
})

app.listen(port, () => {
  console.log(`Library management server is running port ${port}`)
})