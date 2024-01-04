require("dotenv").config();
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: true,
  };
  
  passport.use(new JwtStrategy(jwtOptions, async (req, jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.userId).exec();
      if (user) {
        req.user = user; // Optionally attach the user to the request object
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      console.log(err);
      return done(err, false);
    }
  }));

// Local Strategy for username/password authentication
const localOptions = {
  usernameField: 'username',
  passwordField: 'password',
};

passport.use(new LocalStrategy(localOptions, async (username, password, done) => {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    return done(null, user); // Pass the user to the done callback
  } catch (err) {
    return done(err);
  }
}));

// Export the configured passport
module.exports = passport;
