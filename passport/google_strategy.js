const passport=require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
GOOGLE_CLIENT_ID="392867223238-flelte9svq2dmbt27u861vlsemqlno69.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

passport.serializeUser((user,done)=>{
    done(null,user);
});

passport.deserializeUser((id,done)=>{
    done(null,id);
});


passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)
    return cb(null,profile);
  }
));