//= require ./core
//= require ./utils
//= require ./state

(function () {

"use strict";

/**
 * @memberof Marbles
 * @class
 * @param {*} id Anything serializable as JSON
 * @desc This class is meant to be sub-classed using Store.createClass
 */
var Store = Marbles.Store = function (id) {
	this.id = id;
	this.constructor.__trackInstance(this);

	this.__changeListeners = [];

	this.willInitialize.apply(this, Array.prototype.slice.call(arguments, 1));

	this.state = this.getInitialState();

	this.didInitialize.apply(this, Array.prototype.slice.call(arguments, 1));
};

Store.displayName = "Marbles.Store";

Marbles.Utils.extend(Store.prototype, Marbles.State, {
	/**
	 * @memberof Marbles.Store
	 * @instance
	 * @method
	 * @returns {Object} Initial state object
	 */
	getInitialState: function () {
		return {};
	},

	/**
	 * @memberof Marbles.Store
	 * @instance
	 * @method
	 * @desc Called before state is initialized
	 */
	willInitialize: function () {},

	/**
	 * @memberof Marbles.Store
	 * @instance
	 * @method
	 * @desc Called after state is initialized
	 */
	didInitialize: function () {},

	/**
	 * @memberof Marbles.Store
	 * @instance
	 * @method
	 * @desc Called when first change listener is added
	 */
	didBecomeActive: function () {},

	/**
	 * @memberof Marbles.Store
	 * @instance
	 * @method
	 * @desc Called when last change listener is removed and when the instance is otherwise perceived as inactive
	 */
	didBecomeInactive: function () {},

	/**
	 * @memberof Marbles.Store
	 * @instance
	 * @method
	 * @param {Object} event
	 * @desc Called with Dispatcher events
	 */
	handleEvent: function () {}
});

// Call didBecomeActive when first change listener added
Store.prototype.addChangeListener = function () {
	this.__changeListenerExpected = false;
	Marbles.State.addChangeListener.apply(this, arguments);
	if ( !this.__active && this.__changeListeners.length === 1 ) {
		this.__active = true;
		this.didBecomeActive();
	}
};

// Call didBecomeInactive when last change listener removed
Store.prototype.removeChangeListener = function () {
	var done = function () {
		this.__active = false;
	}.bind(this);
	Marbles.State.removeChangeListener.apply(this, arguments);
	if (this.__changeListeners.length === 0 && !this.__changeListenerExpected) {
		Promise.resolve(this.didBecomeInactive()).then(done);
	}
};

Store.prototype.expectChangeListener = function () {
	this.__changeListenerExpected = true;
};

Store.prototype.unexpectChangeListener = function () {
	this.__changeListenerExpected = false;
	console.log("unexpectChangeListener", this.__changeListeners.length);
	if (this.__changeListeners.length === 0) {
		Promise.resolve(this.didBecomeInactive()).then(function () {
			this.__active = false;
		}.bind(this));
	}
};

Store.__instances = {};

function stringifyStoreId(id) {
	if (id && typeof id === "object" && !Array.isArray(id)) {
		var keys = Object.keys(id);
		var values = keys.map(function (k) {
			return id[k];
		});
		return JSON.stringify(keys.sort().concat(values.sort()));
	} else if (Array.isArray(id)) {
		return "["+ id.map(stringifyStoreId).join(",") +"]";
	} else {
		return JSON.stringify(id);
	}
}

Store.__getInstance = function (id, opts) {
	opts = opts || {};
	var key = stringifyStoreId(id);
	return this.__instances[key] || (opts.allowNull ? null : new this(id));
};

Store.__trackInstance = function (instance) {
	var key = stringifyStoreId(instance.id);
	this.__instances[key] = instance;
};

/**
 * @memberof Marbles.Store
 * @func
 * @param {Marbles.Store} store
 * @desc Give Store instance up for garbage collection
 */
Store.discardInstance = function (instance) {
	var key = stringifyStoreId(instance.id);
	delete this.__instances[key];
};

/**
 * @memberof Marbles.Store
 * @func
 * @param {Store#id} id
 */
Store.addChangeListener = function (id) {
	var instance = this.__getInstance(id);
	return instance.addChangeListener.apply(instance, Array.prototype.slice.call(arguments, 1));
};

/**
 * @memberof Marbles.Store
 * @func
 * @param {Store#id} id
 */
Store.removeChangeListener = function (id) {
	var instance = this.__getInstance(id);
	return instance.removeChangeListener.apply(instance, Array.prototype.slice.call(arguments, 1));
};

/**
 * @memberof Marbles.Store
 * @func
 * @param {Store#id} id
 * @desc Force store to remain active until the next change listener is added
 */
Store.expectChangeListener = function (id) {
	var instance = this.__getInstance(id, {allowNull: true});
	if (instance) {
		instance.expectChangeListener();
	}
};

/**
 * @memberof Marbles.Store
 * @func
 * @param {Store#id} id
 * @desc Undo expectation from expectChangeListener
 */
Store.unexpectChangeListener = function (id) {
	var instance = this.__getInstance(id, {allowNull: true});
	if (instance) {
		instance.unexpectChangeListener();
	}
};

/**
 * @memberof Marbles.Store
 * @prop {Number}
 */
Store.dispatcherIndex = null;

/**
 * @memberof Marbles.Store
 * @func
 * @param {Marbles.Dispatcher} dispatcher
 */
Store.registerWithDispatcher = function (dispatcher) {
	this.dispatcherIndex = dispatcher.register(function (event) {
		if (event.storeId && (!this.isValidId || this.isValidId(event.storeId))) {
			var instance = this.__getInstance(event.storeId);
			var res = Promise.resolve(instance.handleEvent(event));
			var after = function (isError, args) {
				if (instance.__changeListeners.length === 0) {
					instance.didBecomeInactive();
				}
				if (isError) {
					return Promise.reject(args);
				} else {
					return Promise.resolve(args);
				}
			};
			res.then(after.bind(null, false), after.bind(null, true));
			return res;
		} else {
			return Promise.all(Object.keys(this.__instances).sort().map(function (key) {
				var instance = this.__instances[key];
				return new Promise(function (resolve) {
					resolve(instance.handleEvent(event));
				});
			}.bind(this)));
		}
	}.bind(this));
};

/**
 * @memberof Marbles.Store
 * @func
 * @param {Object} proto Prototype of new child class
 * @desc Creates a new class that inherits from Store
 * @example
 *	var MyStore = Marbles.Store.createClass({
 *		displayName: "MyStore",
 *
 *		getInitialState: function () {
 *			return { my: "state" };
 *		},
 *
 *		willInitialize: function () {
 *			// do something
 *		},
 *
 *		didInitialize: function () {
 *			// do something
 *		},
 *
 *		didBecomeActive: function () {
 *			// do something
 *		},
 *
 *		didBecomeInactive: function () {
 *			// do something
 *		},
 *
 *		handleEvent: function (event) {
 *			// do something
 *		}
 *	});
 *
 */
Store.createClass = function (proto) {
	var parent = this;
	var store = Marbles.Utils.inheritPrototype(function () {
		parent.apply(this, arguments);
	}, parent);

	store.__instances = {};

	if (proto.hasOwnProperty("displayName")) {
		store.displayName = proto.displayName;
		delete proto.displayName;
	}

	Marbles.Utils.extend(store.prototype, proto);

	function wrappedFn(name, id) {
		var instance = this.__getInstance(id);
		var res = instance[name].apply(instance, Array.prototype.slice.call(arguments, 2));
		var after = function (isError, args) {
			if (instance.__changeListeners.length === 0) {
				instance.didBecomeInactive();
			}
			if (isError) {
				return Promise.reject(args);
			} else {
				return Promise.resolve(args);
			}
		};
		Promise.resolve(res).then(after.bind(null, false), after.bind(null, true));
		return res;
	}

	for (var k in proto) {
		if (proto.hasOwnProperty(k) && k.slice(0, 1) !== "_" && typeof proto[k] === "function") {
			store[k] = wrappedFn.bind(store, k);
		}
	}

	return store;
};

})();
