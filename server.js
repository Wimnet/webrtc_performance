var fs = require('fs'),
    express = require('express'),
    https = require('https'),
    http = require('http');

var privateKey = fs.readFileSync('fakekeys/privatekey.pem').toString(),
    certificate = fs.readFileSync('fakekeys/certificate.pem').toString();

var app = express();

app.use(express.static(__dirname));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res, next) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/charts', function(req, res, next) {
	res.sendFile(__dirname + '/charts.html');
});

var port = process.env.PORT || 8081;

https.createServer({key: privateKey, cert: certificate}, app).listen(8000);
var server = app.listen(port, function() {
	console.log('running on https://localhost:8000 and http://localhost:' + port);
});

