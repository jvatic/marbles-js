/* @flow weak */
/**
 * @memberof Marbles
 * @mixin
 * @desc Manages a state object. You must define `state` {Object} and `__changeListeners` {Array} on the object this is mixed into.
 */
var State = {
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

	getState: function () {
		return this.state;
	},

	/**
	 * @method
	 * @param {function} changeFn
	 * @desc Calls `willChange`, the passed in function, `handleChange`, then `didChange`
	 */
	withChange: function (changeFn) {
		this.willChange();
		changeFn.call(this);
		this.handleChange();
		this.didChange();
	},

	/**
	 * @method
	 * @param {Object} newState
	 * @desc Copies properties of newState to the existing state object
	 */
	setState: function (newState) {
		this.withChange(function () {
			var state = this.state;
			Object.keys(newState).forEach(function (key) {
				state[key] = newState[key];
			});
		});
	},

	/**
	 * @method
	 * @param {Object} newState
	 * @param {Number} maxTimeout
	 * @desc Same as setState, but waits up to 10ms for more changes to occur before calling change listeners
	 */
	setStateWithDelay: function (newState, maxTimeout) {
		this.willChange();
		var state = this.state;
		Object.keys(newState).forEach(function (key) {
			state[key] = newState[key];
		});
		this.handleChangeWithDelay(maxTimeout);
	},

	handleChangeWithDelay: function (maxTimeout) {
		maxTimeout = maxTimeout || 10;
		clearTimeout(this.__handleChangeTimeout);
		this.__handleChangeTimeout = setTimeout(function () {
			this.handleChangeDelayed();
		}.bind(this), 2);
		if ( !this.__handleChangeMaxTimeout ) {
			this.__handleChangeMaxTimeout = setTimeout(function () {
				this.handleChangeDelayed();
			}.bind(this), maxTimeout);
		}
	},

	handleChangeDelayed: function () {
		clearTimeout(this.__handleChangeMaxTimeout);
		clearTimeout(this.__handleChangeTimeout);
		this.handleChange();
		this.didChange();
	},

	/**
	 * @method
	 * @param {Object} newState
	 * @desc Replaces the existing state object with newState
	 */
	replaceState: function (newState) {
		this.withChange(function () {
			this.state = newState;
		});
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
	willChange: function () {},

	/**
	 * @method
	 * @desc Called after state object is mutated
	 */
	didChange: function () {}
};

export default State;
