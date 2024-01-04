/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal Server Error
 */
router.post(
  "/signup",
  body("username").exists().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
  body("email").notEmpty().isEmail().withMessage("Email is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, password: hashedPassword, email });
      await user.save();

      res.json({ message: "User created successfully!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to an existing user account and receive an access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token and refresh token generated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Wrong username or password
 */
router.post(
    '/login',
    body('username').exists().notEmpty().withMessage('Username is required'),
    body('password').exists().notEmpty().withMessage('Password is required'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
  
        if (!user) {
          return res.status(401).json({ message: 'Unauthorized - Wrong username or password' });
        }
  
        try {
          // Generate refresh token
          const refreshToken = generateRefreshToken();
            
          // Save the refresh token on the client side or in a secure cookie
          res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
  
          // Generate access token
          const accessToken = generateAccessToken(user._id);
  
          // Respond with access token and refresh token
          res.json({ accessToken, refreshToken });
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      })(req, res, next);
    }
  );
/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh the access token using the refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required.' });
  }

  // Validate the refresh token
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Use the decoded information to generate a new access token
    const newAccessToken = generateAccessToken(decoded.userId);

    // Respond with the new access token
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token.' });
  }
});

// Function to generate a new access token
function generateAccessToken(userId) {
  const payload = { userId };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' }); // Set an appropriate expiration time
}

// Function to generate a refresh token
function generateRefreshToken() {
  return jwt.sign({}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' }); // Set an appropriate expiration time
}

module.exports = router;
