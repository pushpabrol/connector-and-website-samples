var express = require('express');
var samlp = require('samlp');
var Webtask = require('webtask-tools');
var MCrypt = require('mcrypt').MCrypt;
var desEcb = new MCrypt('rijndael-128', 'ecb');
var querystring = require('querystring');
var uuid = require('node-uuid');
var crypto = require('crypto');
var cookieParser = require('cookie-parser')
var app = express();
app.use(cookieParser())


app.get('/cookies', function (req, res) {
  // Cookies that have not been signed
  console.log('Cookies: ', req.cookies)
  res.statusCode = 200;
  res.end(req.cookies['domain']);
  // Cookies that have been signed
  console.log('Signed Cookies: ', req.signedCookies)
})

app.get('/setcookie', function (req, res) {
  console.log(req.query);
  if(req.query.domain !== null)  res.cookie('domain', req.query.domain) // options is optional
  else   res.cookie('domain', 'ldap.desmaximus.com'); // options is optional
  res.sendStatus(200);
  res.end("OK");
});

app.get('/', function(req, res, next) {
  
  if (req.query.hasOwnProperty("SAMLRequest")) {
    
    if( typeof req.cookies["domain"] != 'undefined' && req.cookies["domain"] !== null && req.cookies["domain"] !== '')
    {
      res.statusCode = 301;
      res.redirect('https://' + req.cookies["domain"] + '/secure?thirdParty=zendesk&RelayState=' + req.query.RelayState) 
      
    }
    else 
    {
      res.statusCode = 301;
      res.redirect('https://ldap.desmaximus.com/secure?thirdParty=zendesk&RelayState=' + req.query.RelayState) 
    }
  }
  
  else
  
  {
  var required_params = ['tenant', 'connection', 'publicKey', 'privateKey', 'decryptionKey'];
  for (var p in required_params)
    if (!req.webtaskContext.secrets[required_params[p]]) {
      res.statusCode = 400;
      res.end('The `' + required_params[p] + '` parameter must be provided.');
      return;
  }
  desEcb.open(req.webtaskContext.secrets.decryptionKey); //set the key

  return samlp.auth({
    issuer: 'urn:' + req.webtaskContext.secrets.connection,
    audience: 'urn:auth0:' + req.webtaskContext.secrets.tenant + ':' + req.webtaskContext.secrets.connection,
    destination: 'https://' + req.webtaskContext.secrets.tenant + '.auth0.com/login/callback?connection=' + req.webtaskContext.secrets.connection,
    cert: new Buffer(req.webtaskContext.secrets.publicKey, 'utf-8'),
    key: new Buffer(req.webtaskContext.secrets.privateKey, 'utf-8'),
    getPostURL: function(wtrealm, wreply, req, callback) {
      return callback(null, 'https://' + req.webtaskContext.secrets.tenant + '.auth0.com/login/callback?connection=' + req.webtaskContext.secrets.connection);
    },
    getUserFromRequest: getUser,
    RelayState: req.query.RelayState
  })(req, res, next);
  }
  function getUser(req) {
    //console.log('here');
    var user = {
      emails: []
    };
    var q;
    var property = 'q';
    if (req.query.hasOwnProperty(property)) {
      //console.log(property);
      q = (desEcb.decrypt(new Buffer(req.query[property], 'base64'))).toString().replace(/(\0|\r\n|\n|\r|\u0002)/gm, '');
      console.log(q.length);

      var qsArray = q.split('&');
      var raw_data = {};
      for (var i = 0; i < qsArray.length; i++) {
        //split on first occurrance on = only
        raw_data[qsArray[i].split(/=(.+)?/)[0]] = qsArray[i].split(/=(.+)?/)[1] ? qsArray[i].split(/=(.+)?/)[1] : '' ;
      }
      console.log(raw_data);
      
      /*
      var hash = raw_data.hash;
      delete raw_data.hash;

      //var data_without_hash = 'id=' + raw_data.id.trim() + '&' + 'fname=' + raw_data.fname.trim() + '&' + 'lname=' + raw_data.lname.trim() + '&' + 'time=' + raw_data.time.replace(/(\r\n|\n|\r|\t|\u000b)/gm, "");
      var data_without_hash = 'id=' + raw_data.id.trim() + '&' + 'fname=' + raw_data.fname.trim() + '&' + 'lname=' + raw_data.lname.trim() + '&' + 'time=' + raw_data.time.replace(/[^a-zA-Z0-9: \/]/gm, "");
      
      console.log(data_without_hash.length);
      var myhash = crypto.createHash('sha256').update(data_without_hash).digest('base64');
      console.log(myhash);
      if (hash !== myhash) {
        res.statusCode = 401;
        console.log('Received -> ' + hash + ', Generated -> ' + myhash + '. Message integrity check failed.');
        return null;
      }
      */
      console.log('checkTime: ' + (req.webtaskContext.secrets.checkTime == "true"));
      if (req.webtaskContext.secrets.checkTime == "true") {
        console.log(raw_data.hasOwnProperty('time'));
        if (raw_data.hasOwnProperty('time')) {
          var linkTime = raw_data["time"];
          console.log(linkTime);
          var dt = Date.parse(linkTime);
            console.log(dt);
          if (Date.now() - dt > 60000) 
          {
            console.log('SSO Link has expired');
            return null;
            
          }

        } else 
        {
            
            console.log('Mising parameter, please check why the instant(time) of authentication is not passed.');
            return null;
            
        }
      }



      user["name"] = {
        "familyName": raw_data.lname,
        "givenName": raw_data.fname,
      }
      user["displayName"] = raw_data.fname + " " + raw_data.lname;

      user["id"] = raw_data.id;

      if (raw_data.mail)
        user["email"] = raw_data.mail;
      if (raw_data.email)
        user["email"] = raw_data.email;

    }
    console.log(user);
    return user;
  }

});

module.exports = Webtask.fromExpress(app);
