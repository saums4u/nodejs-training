http = require('http');
request = require('request');
path = require('path')
fs = require('fs')

// Set a the default value for --host to 127.0.0.1
var argv = require('yargs')
    .default('host', '127.0.0.1:8000')
    .argv;
var scheme = 'http://';

// Get the --port value
// If none, default to the echo server port, or 80 if --host exists
var port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80);

// Update our destinationUrl line from above to include the port
var destinationUrl = argv.url || scheme + argv.host + ':' + port

var logPath = argv.log && path.join(__dirname, argv.log);
var logStream = logPath ? fs.createWriteStream(logPath) : process.stdout;

http.createServer((req,res)=>{

	console.log(`Request received at : ${req.url}`);

	for( var header in req.headers) {
		res.setHeader(header, req.headers[header]);
	}

	req.pipe(res);

}).listen(8000);

http.createServer((req,res)=>{

	console.log(`Proxying request to : ${destinationUrl + req.url}`);
	// Log the req headers and content in the **server callback**
	process.stdout.write('\n\n\n' + JSON.stringify(req.headers));
	req.pipe(logStream, {end: false});

	//proxy code
	var options = {
		headers: req.headers,
		url: `http://${destinationUrl}${req.url}`
	};
	options.method = req.method;
	
	// Log the proxy request headers and content in the **server callback**
	var downstreamResponse = req.pipe(request(options));
	logStream.write('Request headers: ' + JSON.stringify(req.headers));
	downstreamResponse.pipe(process.stdout);
	downstreamResponse.pipe(res);
}).listen(8001);