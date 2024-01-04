const request = require('supertest');
const bcrypt = require("bcryptjs");
const app = require('../server'); // Update the path accordingly
const User = require('../models/User');
 // Update the path accordingly
 const mongoose = require('mongoose');

describe('Authentication Routes', () => {
  beforeEach(async () => {
    // Clear the user collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user account', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          password: 'testpassword',
          email: 'test@example.com',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'User created successfully!');
    });

    it('should return validation error if required fields are missing', async () => {
      const response = await request(app).post('/api/auth/signup').send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in and return an access token', async () => {
      // Assuming you have a user already registered for testing
      const existingUser = new User({
        username: 'testuser',
        password: await bcrypt.hash('testpassword', 10),
        email: 'test@example.com',
      });
      await existingUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return validation error if required fields are missing', async () => {
      const response = await request(app).post('/api/auth/login').send({});
      console.log('res0', response.status, response.body)
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return unauthorized if wrong username or password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'wrongpassword',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized - Wrong username or password');
    });
  });
});

afterAll(async () => {
    await new Promise((resolve) => setTimeout(() => resolve(), 500)); // avoid jest open handle error
    app.closeServer();
    mongoose.disconnect();
  });