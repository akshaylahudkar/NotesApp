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
  body("email").notEmpty().withMessage("Email is required"),
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
 *         description: Access token generated successfully
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
  
        req.logIn(user, { session: false }, async (err) => {
          if (err) {
            return next(err);
          }
  
          try {
            // Use your own logic to fetch user data or omit this part if not needed
            // const foundUser = await User.findOne({ username: user.username });
  
            // Issue a JWT token
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
              expiresIn: '1h',
            });
  
            res.json({ accessToken: token });
          } catch (err) {
            res.status(500).json({ error: err.message });
          }
        });
      })(req, res, next);
    }
  );
module.exports = router;
