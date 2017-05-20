var MCrypt = require('mcrypt').MCrypt;
var urlencode = require('urlencode');
var crypto = require("crypto");
var desEcb = new MCrypt('rijndael-128', 'ecb');
var args = require('optimist').usage('Usage: $0 -id [id] -fname [fname] -lname [lname] -mail [mail] ')
    .demand(['id','fname','lname', 'mail'])
    .argv;

var key = '32 charcter key'
desEcb.open(key); // we are set the key

var url = "id={id}&fname={fname}&lname={lname}&mail={mail}&time={time}";

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

if(args.id == '' || args.fname == '' || args.lname == '' || args.mail == '') {
    console.log('id, fname and lname are required parameters!');
}
else
{

var id = args.id;
var fname = args.fname;
var lname = args.lname;
var d = new Date,
    dformat = [d.getMonth()+1,
               d.getDate(),
               d.getFullYear()].join('/')+' '+
              [d.getHours(),
               d.getMinutes(),
               d.getSeconds()].join(':');
var time = dformat;
url = url.replace('{id}', id);
url = url.replace('{fname}', fname);
url = url.replace('{lname}', lname);
url = url.replace('{time}', time);

console.log(url);
var myhash = crypto.createHash('sha256').update(url).digest('base64');
url = 'hash=' + myhash + '&' + url;

var name = desEcb.encrypt(url);
console.log(urlencode(name.toString('base64')));


var finalUrl = 'https://<tenant>.us.webtask.io/connect?q=' + urlencode(name.toString('base64'));

console.log(finalUrl);
}


