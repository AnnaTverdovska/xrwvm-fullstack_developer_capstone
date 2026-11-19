// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const Reviews = require('./review');
const Dealerships = require('./dealership');

const port = process.env.PORT || 3030;
const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo_db:27017/';

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));

// Load the sample data shipped in ./data into MongoDB, replacing what is there
async function seedDatabase() {
  const readData = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'));
  await Reviews.deleteMany({});
  await Reviews.insertMany(readData('reviews.json').reviews);
  await Dealerships.deleteMany({});
  await Dealerships.insertMany(readData('dealerships.json').dealerships);
}

// Express route to home
app.get('/', async (req, res) => {
  res.send('Welcome to the Mongoose API');
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({ dealership: Number(req.params.id) });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch Dealers by a particular state, e.g. /fetchDealers/Kansas
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const documents = await Dealerships.find({ state: req.params.state });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch dealer by a particular id. Returns a list with
// one dealer (or an empty list), which is what the Django app expects.
app.get('/fetchDealer/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Dealer id must be a number' });
  }
  try {
    const documents = await Dealerships.find({ id });
    return res.json(documents);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
  let data;
  try {
    data = JSON.parse(req.body);
  } catch (error) {
    return res.status(400).json({ error: 'Request body must be JSON' });
  }

  try {
    // New reviews get the next free id; the first review gets id 1
    const latest = await Reviews.find().sort({ id: -1 }).limit(1);
    const newId = latest.length > 0 ? latest[0].id + 1 : 1;

    const review = new Reviews({
      id: newId,
      name: data.name,
      dealership: data.dealership,
      review: data.review,
      purchase: data.purchase,
      purchase_date: data.purchase_date,
      car_make: data.car_make,
      car_model: data.car_model,
      car_year: data.car_year,
    });
    const savedReview = await review.save();
    return res.json(savedReview);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Error inserting review' });
  }
});

async function start() {
  await mongoose.connect(mongoUrl, { dbName: 'dealershipsDB' });
  await seedDatabase();
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

// Start the server only when run directly (`node app.js`), not when imported by the tests
if (require.main === module) {
  start().catch((error) => {
    console.error('Could not start the API:', error);
    process.exit(1);
  });
}

module.exports = { app, seedDatabase };
