//= require ./core
//= require ./utils
//= require ./state

(function () {

"use strict";

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
	getInitialState: function () {
		return {};
	},

	willInitialize: function () {},

	didInitialize: function () {},

	didBecomeActive: function () {},

	didBecomeInactive: function () {},

	handleEvent: function () {}
});

// Call didBecomeActive when first change listener added
Store.prototype.addChangeListener = function () {
	Marbles.State.addChangeListener.apply(this, arguments);
	if (this.__changeListeners.length === 1) {
		this.didBecomeActive();
	}
};

// Call didBecomeInactive when last change listener removed
Store.prototype.removeChangeListener = function () {
	Marbles.State.removeChangeListener.apply(this, arguments);
	if (this.__changeListeners.length === 0) {
		this.didBecomeInactive();
	}
};

Store.__instances = {};

Store.__getInstance = function (id) {
	var key = JSON.stringify(id);
	return this.__instances[key] || new this(id);
};

Store.__trackInstance = function (instance) {
	var key = JSON.stringify(instance.id);
	this.__instances[key] = instance;
};

Store.discardInstance = function (instance) {
	var key = JSON.stringify(instance.id);
	delete this.__instances[key];
};

Store.addChangeListener = function (id) {
	var instance = this.__getInstance(id);
	return instance.addChangeListener.apply(instance, Array.prototype.slice.call(arguments, 1));
};

Store.removeChangeListener = function (id) {
	var instance = this.__getInstance(id);
	return instance.removeChangeListener.apply(instance, Array.prototype.slice.call(arguments, 1));
};

Store.dispatcherIndex = null;
Store.registerWithDispatcher = function (dispatcher) {
	this.dispatcherIndex = dispatcher.register(function (event) {
		if (event.storeId) {
			var instance = this.__getInstance(event.storeId);
			return instance.handleEvent(event);
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
		return instance[name].apply(instance, Array.prototype.slice.call(arguments, 2));
	}

	for (var k in proto) {
		if (proto.hasOwnProperty(k) && k.slice(0, 1) !== "_" && typeof proto[k] === "function") {
			store[k] = wrappedFn.bind(store, k);
		}
	}

	return store;
};

})();
