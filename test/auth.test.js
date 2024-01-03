const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server'); // Replace with the path to your Express app file
const User = require('../models/User');
const { expect } = chai;

chai.use(chaiHttp);

describe('Authentication Routes', () => {
  beforeEach(async () => {
    // Clear the database or perform any setup needed before each test
    await User.deleteMany();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user account', async () => {
      const userCredentials = {
        username: 'testuser',
        password: 'testpassword',
        email: 'test@example.com',
      };

      const res = await chai
        .request(app)
        .post('/api/auth/signup')
        .send(userCredentials);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message').to.equal('User created successfully!');
    });

    it('should handle validation error for missing fields', async () => {
      const invalidUserCredentials = {
        username: '',
        password: '',
        email: '',
      };

      const res = await chai
        .request(app)
        .post('/api/auth/signup')
        .send(invalidUserCredentials);

      expect(res).to.have.status(400);
      expect(res.body.errors).to.be.an('array');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user and return an access token', async () => {
      // Create a user for testing
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      const user = new User({ username: 'testuser', password: hashedPassword, email: 'test@example.com' });
      await user.save();

      const userCredentials = {
        username: 'testuser',
        password: 'testpassword',
      };

      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send(userCredentials);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('accessToken');
    });

    it('should handle validation error for missing fields', async () => {
      const invalidUserCredentials = {
        username: '',
        password: '',
      };

      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send(invalidUserCredentials);

      expect(res).to.have.status(400);
      expect(res.body.errors).to.be.an('array');
    });

    it('should handle unauthorized access for wrong credentials', async () => {
      const wrongUserCredentials = {
        username: 'nonexistentuser',
        password: 'wrongpassword',
      };

      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send(wrongUserCredentials);

      expect(res).to.have.status(401);
    });
  });
});
