/* @flow weak */
/* @flow weak */
var __callbacks = [];
var __lock = Promise.resolve();

/**
 * @memberof Marbles
 * @mixin
 * @desc Simple FLUX Dispatcher
 */
var Dispatcher = {
	/**
	 * @method
	 * @param {function} callback Function to call events with
	 * @returns {Number} Dispatch index
	 */
	register: function (callback) {
		__callbacks.push(callback);
		var dispatchIndex = __callbacks.length - 1;
		return dispatchIndex;
	},

	/**
	 * @method
	 * @param {Object} event An event object
	 * @returns {Promise} Resolves when all registered callbacks have been called
	 */
	dispatch: function (event) {
		__lock = __lock.then(function () {
			var p = Promise.resolve();
			__callbacks.forEach(function (callback) {
				return p.then(function () {
					return callback(event);
				});
			});
			return p;
		});
		return __lock;
	}
};

export default Dispatcher;
