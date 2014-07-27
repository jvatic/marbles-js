//= require ./core

(function () {
"use strict";

/**
 * @memberof Marbles
 * @mixin
 * @desc Manages a state object. You must define `state` {Object} and `__changeListeners` {Array} on the object this is mixed into.
 */
Marbles.State = {
	/**
	 * @method
	 * @param {function} handler Function to call when the state object changes
	 */
	addChangeListener: function (handler) {
		this.__changeListeners.push(handler);
	},

	/**
	 * @method
	 * @param {function} handler
	 * @desc Prevents handler from being called for future changes
	 */
	removeChangeListener: function (handler) {
		this.__changeListeners = this.__changeListeners.filter(function (fn) {
			return fn !== handler;
		});
	},

	/**
	 * @method
	 * @param {Object} newState
	 * @desc Copies properties of newState to the existing state object
	 */
	setState: function (newState) {
		this.willUpdate();
		var state = this.state;
		Object.keys(newState).forEach(function (key) {
			state[key] = newState[key];
		});
		this.handleChange();
		this.didUpdate();
	},

	/**
	 * @method
	 * @param {Object} newState
	 * @desc Replaces the existing state object with newState
	 */
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

	/**
	 * @method
	 * @desc Called before state object is mutated
	 */
	willUpdate: function () {},

	/**
	 * @method
	 * @desc Called after state object is mutated
	 */
	didUpdate: function () {}
};

})();
