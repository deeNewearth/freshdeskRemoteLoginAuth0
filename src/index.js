//https://auth0.com/docs/quickstart/webapp/nodejs/01-login#configure-auth0

//if locked out goto
//https://yourcompany.freshdesk.com/login/normal

const express = require('express');
const app = express();

const passport = require('passport');
const Auth0Strategy = require('passport-auth0');

if (!process.env.AUTH0_DOMAIN 
    || !process.env.AUTH0_CLIENTID || !process.env.AUTH0_CLIENTSECRET) {
    throw 'Make sure you have AUTH0_DOMAIN, AUTH0_CLIENTSECRET and AUTH0_CLIENTID in your env';
}

if (!process.env.FD_SHARED_SECRET || !process.env.FD_URL ) {
    throw 'Make sure you have FD_SHARED_SECRET, FD_URL in your env';
}

const callBackUrl = process.env.CALLBACK_URL || '/callback';//   'https://helpdesk.scanrev.com/callback'
console.log(`using callBackUrl ${callBackUrl}`);

const strategy = new Auth0Strategy({
    domain:       process.env.AUTH0_DOMAIN,
    clientID:     process.env.AUTH0_CLIENTID,
    clientSecret: process.env.AUTH0_CLIENTSECRET,
    callbackURL:  callBackUrl,
    state:false
   },
   function(accessToken, refreshToken, extraParams, profile, done) {
     // accessToken is the token to call Auth0 API (not needed in the most cases)
     // extraParams.id_token has the JSON Web Token
     // profile has all the information from the user
     return done(null, profile);
   }
 );

 passport.use(strategy);
 app.use(passport.initialize()); 


 const crypto = require('crypto');

/**
	 * Generates and returns a Freshdesk Single Sign On URL
	 * {@link https://gist.github.com/derekseymour/26a6fe573c1274642976 Gist}
	 *
	 * @author Derek Seymour <derek@rocketideas.com>
	 * @param {String} name - The name of the user logging in.
	 * @param {String} email - A valid email address to associate with the user.
	 * @param {String} [redirect_to] - An optional URL to redirect to after logging in.
	 * @returns {String} Freshdesk SSO URL.
*/
function getSSOUrl(name, email, redirect_to) {

		var timestamp = Math.floor(new Date().getTime() / 1000).toString();
		var hmac = crypto.createHmac('md5', process.env.FD_SHARED_SECRET);
		hmac.update(name + process.env.FD_SHARED_SECRET + email + timestamp);
		var hash = hmac.digest('hex');
		return process.env.FD_URL + '/login/sso/' +
			'?name=' + escape(name) +
			'&email=' + escape(email) +
			'&timestamp=' + escape(timestamp) +
			'&hash=' + escape(hash) +
			( typeof(redirect_to) === 'string' ? '&redirect_to=' + escape(redirect_to) : '' );
}

app.get('/callback',function (req, res, next) {
    passport.authenticate('auth0', function (err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/'); }

        console.log(`signed in user name:${user._json.name} id:${user._json.sub}`);

        const freshDeskUrl = getSSOUrl(user._json.name,user._json.email);
        res.redirect(freshDeskUrl);

    })(req, res, next);
});



app.get('/login',
  passport.authenticate('auth0', {
    scope: 'openid email profile'
  }), function (req, res) {
    res.json({
        message: 'We need to sign in'
      });
});


app.get('*', function (req, res) {
  res.json({
      message: 'hello world'
    });
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  return res.status(err.status).json({ message: err.message });
});

app.listen(80, () => console.log('Server running'));
