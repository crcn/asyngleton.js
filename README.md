### Example

```javascript

var asyngleton = require('../'),
fs = require('fs');

//called ONCE
var readDir = asyngleton(function(callback) {
	fs.readdir(__dirname, callback);
})

//initializes the singleton method above
readDir(function(err, files) {
	//do stuff
})

//called after there's a result
readDir(function(err, files) {
	//do stuff
});

```