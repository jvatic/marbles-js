var __callbacks = [];

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
		var promises = __callbacks.map(function (callback) {
			return new Promise(function (resolve) {
				resolve(callback(event));
			});
		});
		return Promise.all(promises);
	}
};

export default Dispatcher;
