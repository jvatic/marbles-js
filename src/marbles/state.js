//= require ./core

(function () {
"use strict";

/*
 * State object mixin
 *
 * Requires Object `state` and Array `__changeListeners` properties
 */

Marbles.State = {
	addChangeListener: function (handler) {
		this.__changeListeners.push(handler);
	},

	removeChangeListener: function (handler) {
		this.__changeListeners = this.__changeListeners.filter(function (fn) {
			return fn !== handler;
		});
	},

	setState: function (newState) {
		var state = this.state;
		Object.keys(newState).forEach(function (key) {
			state[key] = newState[key];
		});
		this.handleChange();
	},

	replaceState: function (newState) {
		this.state = newState;
		this.handleChange();
	},

	handleChange: function () {
		this.__changeListeners.forEach(function (handler) {
			handler();
		});
	}
};

})();
