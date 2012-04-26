var EventEmitter = require("events").EventEmitter;

module.exports = function(fn) {

	var em, singletonArgs, called;

	return function() {

		var callback = arguments[arguments.length - 1];

		//result already set? return the value
		if(singletonArgs) {
			return callback(null, singletonArgs);
		}


		if(!em) em = new EventEmitter();
		em.on("singleton", callback);

		//still loading? add listener to event emitter
		if(called) return;
		called = true;

		var args = Array.prototype.splice.call([], arguments);

		//remove the callback
		args.pop();

		args.push(function() {
			singletonArgs = Array.prototype.slice.call(arguments, 0);
			em.emit.apply(em, ["singleton"].concat(singletonArgs));

			//dispose
			em.removeAllListeners("singleton");
		});

		fn.apply(this, args);
	}
};