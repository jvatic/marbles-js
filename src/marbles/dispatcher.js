//= require ./core

(function () {
"use strict";

var __callbacks = [];

Marbles.Dispatcher = {
	register: function (callback) {
		__callbacks.push(callback);
		var dispatchIndex = __callbacks.length - 1;
		return dispatchIndex;
	},

	dispatch: function (event) {
		var promises = __callbacks.map(function (callback) {
			return new Promise(function (resolve) {
				resolve(callback(event));
			});
		});
		return Promise.all(promises);
	}
};

})();
