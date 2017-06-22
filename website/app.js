var express = require('express');

var port = 8080;

var app = express.createServer();

function checkAuth (req, res, next) {
	console.log('checkAuth ' + req.url);

	// don't serve /secure to those not logged in
	// you should add to this list, for each and every secure url
	if (req.url.indexOf('/secure') === 0 && (!req.session || !req.session.authenticated)) {
		res.render('unauthorised', { status: 403,tp:req.query.thirdParty, rs:req.query.RelayState});
		return;
	}

	next();
}

app.configure(function () {

	app.use(express.cookieParser());
	app.use(express.session({ secret: 'example' }));
	app.use(express.bodyParser());
	app.use(checkAuth);
	app.use(app.router);
	app.set('view engine', 'jade');
	app.set('view options', { layout: false });

});

require('./lib/routes.js')(app);
app.listen(port, "0.0.0.0");
console.log('Node listening on port %s', port);
