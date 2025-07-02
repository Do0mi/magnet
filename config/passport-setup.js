const passport = require('passport');
const User = require('../models/user-model');

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Only configure Google Strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 'google.id': profile.id });
        
        if (existingUser) {
          return done(null, existingUser);
        }
        
        // Create new user
        const newUser = new User({
          username: profile.displayName,
          email: profile.emails[0].value,
          google: {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value
          }
        });
        
        await newUser.save();
        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    })
  );
} else {
  console.log('Google OAuth credentials not provided. Google authentication disabled.');
}

// Only configure Facebook Strategy if credentials are provided
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  const FacebookStrategy = require('passport-facebook').Strategy;
  passport.use(
    new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: '/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 'facebook.id': profile.id });
        
        if (existingUser) {
          return done(null, existingUser);
        }
        
        // Create new user
        const newUser = new User({
          username: profile.displayName,
          email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
          facebook: {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`
          }
        });
        
        await newUser.save();
        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    })
  );
} else {
  console.log('Facebook OAuth credentials not provided. Facebook authentication disabled.');
}

// Only configure Twitter Strategy if credentials are provided
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  const TwitterStrategy = require('passport-twitter').Strategy;
  passport.use(
    new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: '/api/auth/twitter/callback',
      includeEmail: true
    }, async (token, tokenSecret, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 'twitter.id': profile.id });
        
        if (existingUser) {
          return done(null, existingUser);
        }
        
        // Create new user
        const newUser = new User({
          username: profile.displayName,
          email: profile.emails ? profile.emails[0].value : `${profile.id}@twitter.com`,
          twitter: {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails ? profile.emails[0].value : `${profile.id}@twitter.com`
          }
        });
        
        await newUser.save();
        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    })
  );
} else {
  console.log('Twitter OAuth credentials not provided. Twitter authentication disabled.');
}
