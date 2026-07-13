// tests/context.test.js
const request = require('supertest');
const express = require('express');
const contextRoutes = require('../routes/context');

describe('context routes', () => {
  let app, stadiumContext;

  beforeEach(() => {
    stadiumContext = { crowdDensity: "low", noiseLevel: "normal", language: "en", zones: [] };
    app = express();
    app.use(express.json());
    app.use('/api/context', contextRoutes(stadiumContext));
  });

  test('GET / returns current context', async () => {
    const res = await request(app).get('/api/context');
    expect(res.status).toBe(200);
    expect(res.body.crowdDensity).toBe("low");
  });

  test('POST / merges new fields into context', async () => {
    const res = await request(app).post('/api/context').send({ crowdDensity: "high" });
    expect(res.status).toBe(200);
    expect(res.body.crowdDensity).toBe("high");
    expect(res.body.language).toBe("en"); // untouched fields stay intact
  });

  test('POST /reset restores exactly 4 zones with expected ids', async () => {
    const res = await request(app).post('/api/context/reset');
    expect(res.status).toBe(200);
    expect(res.body.zones).toHaveLength(4);
    expect(res.body.zones.map(z => z.id)).toEqual(["A", "B", "C", "D"]);
  });
});