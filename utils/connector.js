// mySQL connector

const { createConnection } = require('mysql2');

var mySqlConnection = createConnection({
  host     : 'localhost',
  user     : 'mayur',
  password : 'password'
});
 
async function connectUserDb() {
    mySqlConnection.connect((err) => {

        if (err) {
            console.error('error connecting to mySQL user DB instance: \n' + err.stack);
            return null;
        }

        console.log('mySQL user DB connected');
    });

    return mySqlConnection;
}

// mongoDB connector

// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://mayur:<password>@cluster0.dpi6cpt.mongodb.net/?retryWrites=true&w=majority";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });
// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);

module.exports = {
    connectUserDb,
}