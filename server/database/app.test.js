// Route tests with the Mongoose models replaced by in-memory fakes,
// so they run without a MongoDB server: `npm test`
const request = require('supertest');

const mockDealers = [
  { id: 1, full_name: 'Holdlamis Car Dealership', city: 'El Paso', state: 'Texas', zip: '88563' },
  { id: 2, full_name: 'Temp Car Dealership', city: 'Minneapolis', state: 'Minnesota', zip: '55413' },
  { id: 3, full_name: 'Sub-Ex Car Dealership', city: 'Houston', state: 'Texas', zip: '77255' },
];
const mockReviews = [
  { id: 1, name: 'Berkly Shepley', dealership: 15, review: 'Great service' },
  { id: 2, name: 'Gwenora Zettoi', dealership: 2, review: 'Fast and friendly' },
];

const mockMatches = (query) => (doc) => Object.entries(query).every(([key, value]) => doc[key] === value);

jest.mock('./dealership', () => ({
  find: jest.fn(async (query = {}) => mockDealers.filter(mockMatches(query))),
}));

jest.mock('./review', () => {
  const saved = [];
  function Review(doc) {
    Object.assign(this, doc);
    this.save = jest.fn(async () => {
      saved.push(doc);
      return doc;
    });
  }
  Review.saved = saved;
  Review.find = jest.fn((query = {}) => {
    const result = mockReviews.filter(mockMatches(query));
    // Supports both `await find()` and `find().sort().limit()`
    const chain = Promise.resolve(result);
    chain.sort = () => ({ limit: async (n) => [...result].sort((a, b) => b.id - a.id).slice(0, n) });
    return chain;
  });
  return Review;
});

const Reviews = require('./review');
const { app } = require('./app');

describe('dealers', () => {
  test('GET /fetchDealers returns all dealers', async () => {
    const res = await request(app).get('/fetchDealers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  test('GET /fetchDealers/:state filters by state', async () => {
    const res = await request(app).get('/fetchDealers/Texas');
    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.id)).toEqual([1, 3]);
  });

  test('GET /fetchDealer/:id returns a list with that dealer', async () => {
    const res = await request(app).get('/fetchDealer/2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([mockDealers[1]]);
  });

  test('GET /fetchDealer/:id with an unknown id returns an empty list', async () => {
    const res = await request(app).get('/fetchDealer/99');
    expect(res.body).toEqual([]);
  });

  test('GET /fetchDealer/:id rejects ids that are not numbers', async () => {
    const res = await request(app).get('/fetchDealer/abc');
    expect(res.status).toBe(400);
  });
});

describe('reviews', () => {
  test('GET /fetchReviews/dealer/:id returns that dealer\'s reviews', async () => {
    const res = await request(app).get('/fetchReviews/dealer/2');
    expect(res.body).toEqual([mockReviews[1]]);
  });

  test('POST /insert_review saves the review with the next id', async () => {
    const review = {
      name: 'Anna', dealership: 2, review: 'Great!', purchase: true,
      purchase_date: '2024-02-01', car_make: 'Audi', car_model: 'A4', car_year: 2021,
    };
    const res = await request(app)
      .post('/insert_review')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(review));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...review, id: 3 });
    expect(Reviews.saved).toHaveLength(1);
  });

  test('POST /insert_review rejects a body that is not JSON', async () => {
    const res = await request(app)
      .post('/insert_review')
      .set('Content-Type', 'text/plain')
      .send('not json');
    expect(res.status).toBe(400);
  });
});
