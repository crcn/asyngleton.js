var asyngleton = require('../'),
fs = require('fs');


var readDir = asyngleton(function(callback) {
	console.log("READ DIR");
	fs.readdir(__dirname, callback);
})


readDir(function(err, files) {
	console.log("RESULT");
	console.log(files)
})

readDir(function(err, files) {
	console.log("RESULT 2");
});

setTimeout(function() {
	readDir(function(err, files) {
		console.log("RESULT 3")
	})
}, 500);