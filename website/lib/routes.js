var util = require('util');

module.exports = function (app) {

	app.get('/', function (req, res, next) {
		res.render('index');
	}); 

	app.get('/welcome', function (req, res, next) {
		res.render('welcome');
	});

	app.get('/secure', function (req, res, next) {
		console.log(req.query);
		if(req.query.thirdParty != null)
		// Note - Here I am using a hard coded url but in real use the link should be generated when clicked 	
		res.render('secure', {  url: 'https://<tenant>.us.webtask.io/connect?q=<encrypted>',user_id:'user',email:'user'});
		else res.render('secure', {url:'',user_id:'user',email:'user'});
	     
	});

	app.get('/login', function (req, res, next) {

	console.log(req.query);	
	if(typeof req.query.thirdParty != 'undefined' && req.query.thirdParty != null  && req.query.thirdParty != '')
		res.render('login', { flash: req.flash(),thirdParty:req.query.thirdParty } );
	else res.render('login', { flash: req.flash(),thirdParty: ''} );
	});

	app.post('/login', function (req, res, next) {

		// you might like to do a database look-up or something more scalable here
		if (req.body.username && req.body.username === 'user' && req.body.password && req.body.password === 'pass') {
			req.session.authenticated = true;
			req.session.user = 'user';
			console.log(req.session)
			console.log(req.body);
			if(typeof req.body.path != 'undefined' && req.body.path != null && req.body.path != '' ) res.redirect('/secure?thirdParty=' + req.body.path);
			else res.redirect('/secure');
		} else {
			req.flash('error', 'Username and password are incorrect');
			res.redirect('/login');
		}

	});

	app.get('/logout', function (req, res, next) {
		delete req.session.authenticated;
		res.redirect('/');
	});

};
