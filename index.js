const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express()

//middleware
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wqvu6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        console.log('conected done');
        const ServicesCollection = client.db("hotelMaster").collection("services");
        const BookingCollection = client.db("hotelMaster").collection("bookings");
        const RoomsCollection = client.db("hotelMaster").collection("rooms");
        const ReviewsCollection = client.db("hotelMaster").collection("reviews");

        //get all services
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = await ServicesCollection.find(query).toArray();
            res.send(cursor);
        })

        //get single data
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await ServicesCollection.findOne(query);
            res.send(service);
        })
        //get all rooms
        app.get('/rooms',async(req,res)=>{
            const query={};
            const rooms=await RoomsCollection.find(query).toArray();
            res.send(rooms);
        })
        //post booking
        app.post('/booking',async(req,res)=>{
            const booking=req.body;
            const query={email:booking.email,date:booking.date};
            const exist=await BookingCollection.findOne(query);
            //if already booked then won't book
            if(exist){
                return res.send({success:false,booking:exist})
            }
            const result=await BookingCollection.insertOne(booking);
            res.send({success:true,result});
        })
        //get booking
        // app.get('/booking',async(req,res)=>{
        //     const query={};
        //     const booking=await BookingCollection.find(query).toArray();
        //     res.send(booking);
        // })
        
        //get booking by query =[email:abc]
        app.get('/booking',async(req,res)=>{
            const email=req.query.email;
            const query={email:email};
            const result=await BookingCollection.find(query).toArray();
            res.send(result);
        })
        //available booking
        app.get('/available',async(req,res)=>{
            const date=req.query.date;

            //get all services
            const services=await ServicesCollection.find().toArray();
            // res.send(services);

            //get the booking for that date
            const query={date:date};
            const bookings=await BookingCollection.find(query).toArray();
            
            // forEach service
            services.forEach(service=>{
                //filter use to select somedata [output]:[{},{},{} etc etc]
                const serviceBooking=bookings.filter(b=>b.room === service.title);
                const booked=serviceBooking.map(book=>book.time);
                //filter not selected times
                const available=service.time.filter(t=>!booked.includes(t));
                service.time=available;
            })
            res.send(services);
        })
        //post review
        app.post('/reviews',async(req,res)=>{
            const reviews=req.body;
            const result=await ReviewsCollection.insertOne(reviews);
            res.send(result)
        })
        //get all reviews
        app.get('/reviews',async(req,res)=>{
            const query={};
            const reviews=await ReviewsCollection.find(query).toArray();
            res.send(reviews);
        })
    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('hotel master server is ready');
})
app.listen(port, () => {
    console.log('Listening from hotel master backend')
})
