var EventEmitter = require("events").EventEmitter;

/**
 */

function createAsyngleton(fn) {

	var em = new EventEmitter(), singletonArgs, called;

	var ret = function() {

		var callback = arguments[arguments.length - 1];

		//result already set? return the value
		if(singletonArgs) {
			return callback(null, singletonArgs);
		}


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
	};


	ret.reset = function() {
		singletonArgs = undefined;
		called = false;
		return ret;
	}

	return ret;
}

/**
 */

function createDictionary() {

	var _dict = {};

	return {
		get: function(key, fn) {
			if(_dict[key]) return _dict[key];

			var asyngleton = _dict[key] = createAsyngleton(fn);

			asyngleton.dispose = function() {
				delete _dict[key];
			}

			return asyngleton;
		}
	}
}

module.exports = createAsyngleton;
module.exports.dictionary = createDictionary;