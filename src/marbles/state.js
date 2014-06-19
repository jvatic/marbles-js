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
		this.willUpdate();
		var state = this.state;
		Object.keys(newState).forEach(function (key) {
			state[key] = newState[key];
		});
		this.handleChange();
		this.didUpdate();
	},

	replaceState: function (newState) {
		this.willUpdate();
		this.state = newState;
		this.handleChange();
		this.didUpdate();
	},

	handleChange: function () {
		this.__changeListeners.forEach(function (handler) {
			handler();
		});
	},

	willUpdate: function () {},

	didUpdate: function () {}
};

})();
