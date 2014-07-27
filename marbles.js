var Marbles = {
  VERSION: '0.0.4'
};

(function () {

	"use strict";

	var __extend = function (obj, others, options) {
		var override = options.override;

		for (var i = 0, _len = others.length; i < _len; i++) {
			var other = others[i];

			for (var key in other) {
				if (other.hasOwnProperty(key)) {
					if (override === false) {
						continue;
					}
					obj[key] = other[key];
				}
			}
		}

		return obj;
	};


	Marbles.Utils = {
		// @function (obj, [other [, other...]])
		extend: function (obj) {
			var others = Array.prototype.slice.call(arguments, 1);
			return __extend(obj, others, {override: true});
		},

		lazyExtend: function (obj) {
			var others = Array.prototype.slice.call(arguments, 1);
			return __extend(obj, others, {override: false});
		},

		// @function (child, parent)
		// The prototype of child is made to inherit from parent.
		// Returns child.
		// A `__super__` property is added to child
		// for access to the parent prototype.
		inheritPrototype: function(child, parent) {
			Marbles.Utils.extend(child, parent);

			function Ctor() {
				this.constructor = child;
			}
			Ctor.prototype = parent.prototype;
			child.prototype = new Ctor();
			child.__super__ = parent.prototype;
			return child;
		},

		// @function (proto)
		// returns constructor function
		createClass: function (proto) {
			var ctor,
					willInitialize = proto.willInitialize,
					didInitialize = proto.didInitialize,
					k, i, _len, mixin, mixin_callbacks;

			mixin_callbacks = {
				didExtendCtor: [],
				didExtendProto: [],
				willInitialize: [],
				didInitialize: []
			};

			if (proto.hasOwnProperty('willInitialize')) {
				delete proto.willInitialize;
			}
			if (proto.hasOwnProperty('didInitialize')) {
				delete proto.didInitialize;
			}

			// Override willInitialize hook to
			// call mixin hooks first
			var __willInitialize = willInitialize;
			willInitialize = function () {
				var args = arguments;
				mixin_callbacks.willInitialize.forEach(function (callback) {
					callback.apply(this, args);
				}.bind(this));
				if (__willInitialize) {
					return __willInitialize.apply(this, args);
				}
			};

			// Override didInitialize hook to
			// call mixin hooks first
			var __didInitialize = didInitialize;
			didInitialize = function () {
				var args = arguments;
				mixin_callbacks.didInitialize.forEach(function (callback) {
					callback.apply(this, args);
				}.bind(this));
				if (__didInitialize) {
					__didInitialize.apply(this, args);
				}
			};

			if (proto.hasOwnProperty('parentClass')) {
				var parent = proto.parentClass;
				delete proto.parentClass;

				ctor = function () {
					// Handle any initialization before
					// we call the parent constructor
					var res = willInitialize.apply(this, arguments);
					if (res) {
						return res;
					}

					// Call the parent constructor
					ctor.__super__.constructor.apply(this, arguments);

					// Handle any initialization after
					// we call the parent constructor
					didInitialize.apply(this, arguments);

					return this;
				};

				Marbles.Utils.inheritPrototype(ctor, parent);
			} else {
				ctor = function () {
					// Call initialization functions
					if (typeof willInitialize === 'function') {
						var res = willInitialize.apply(this, arguments);
						if (res && res.constructor === ctor) {
							return res;
						}
					}
					if (typeof didInitialize === 'function') {
						didInitialize.apply(this, arguments);
					}
					return this;
				};
			}

			// If a displayName property is given
			// move it to the constructor
			if (proto.hasOwnProperty('displayName')) {
				ctor.displayName = proto.displayName;
				delete proto.displayName;
			}

			// Grab any given mixins from proto
			var mixins = [];
			if (proto.hasOwnProperty('mixins')) {
				mixins = proto.mixins;
				delete proto.mixins;
			}

			// Convenience method for creating subclass
			ctor.createClass = function (proto) {
				var _child_ctor = Marbles.Utils.createClass(Marbles.Utils.extend({}, proto, {
					parentClass: ctor
				}));

				['didExtendCtor', 'didExtendProto'].forEach(function (callback_name) {
					mixin_callbacks[callback_name].forEach(function (callback) {
						callback(_child_ctor);
					});
				});

				return _child_ctor;
			};

			// Add all remaining properties
			// on proto to the prototype
			for (k in proto) {
				if (proto.hasOwnProperty(k)) {
					ctor.prototype[k] = proto[k];
				}
			}

			// Extend the prototype and/or ctor with any given mixins
			for (i = 0, _len = mixins.length; i < _len; i++) {
				mixin = mixins[i];
				if (mixin.hasOwnProperty('ctor') || mixin.hasOwnProperty('proto')) {
					// extend ctor
					if (mixin.hasOwnProperty('ctor')) {
						Marbles.Utils.extend(ctor, mixin.ctor);

						if (typeof mixin.didExtendCtor === 'function') {
							mixin_callbacks.didExtendCtor.push(mixin.didExtendCtor);
							mixin.didExtendCtor(ctor);
						}
					}

					// extend proto
					if (mixin.hasOwnProperty('proto')) {
						Marbles.Utils.extend(ctor.prototype, mixin.proto);

						if (typeof mixin.didExtendProto === 'function') {
							mixin_callbacks.didExtendCtor.push(mixin.didExtendProto);
							mixin.didExtendProto(ctor);
						}
					}

					if (typeof mixin.willInitialize === 'function') {
						mixin_callbacks.willInitialize.push(mixin.willInitialize);
					}

					if (typeof mixin.didInitialize === 'function') {
						mixin_callbacks.didInitialize.push(mixin.didInitialize);
					}
				} else {
					// It's a plain old object
					// extend the prototype with it
					Marbles.Utils.extend(ctor.prototype, mixin);
				}
			}

			return ctor;
		}
	};

})();

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
		if (event.storeId && (!this.isValidId || this.isValidId(event.storeId))) {
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



(function () {

	"use strict";

	var EVENT_SPLITTER = /\s+/;

	function initEvents(obj) {
		if (!obj.__events) {
			obj.__events = {};
		}
	}

	Marbles.Events = {
		on: function (events, callback, context, options) {
			initEvents(this);

			if (!Array.isArray(events)) {
				events = events.split(EVENT_SPLITTER);
			}

			var name;
			for (var i = 0, _len = events.length; i < _len; i++) {
				name = events[i];
				if (!this.__events[name]) {
					this.__events[name] = [];
				}
				this.__events[name].push({
					callback: callback,
					context: context || this,
					options: options || {}
				});
			}

			return this; // chainable
		},

		once: function (events, callback, context, options) {
			if (!Array.isArray(events)) {
				events = events.split(EVENT_SPLITTER);
			}

			var bindEvent = function (name) {
				var __callback = function () {
					this.off(name, __callback, this);
					callback.apply(context, arguments);
				};
				this.on(name, __callback, this, options);
			}.bind(this);

			for (var i = 0, _len = events.length; i < _len; i++) {
				bindEvent(events[i]);
			}

			return this; // chainable
		},

		off: function (events, callback, context) {
			// Allow unbinding all events at once
			if (arguments.length === 0) {
				if (this.hasOwnProperty('__events')) {
					delete this.__events;
				}
				return this; // chainable
			}

			if (!Array.isArray(events)) {
				events = events.split(EVENT_SPLITTER);
			}

			if (!this.__events) {
				return this; // chainable
			}

			var __filterFn = function (binding) {
				if (context && context !== binding.context) {
					return true;
				}
				if (callback && callback !== binding.callback) {
					return true;
				}
				return false;
			};

			var name, i, _len, bindings;
			for (i = 0, _len = events.length; i < _len; i++) {
				name = events[i];

				if (callback === undefined && context === undefined) {
					if (this.__events.hasOwnProperty(name)) {
						delete this.__events[name];
					}
					continue;
				}

				bindings = this.__events[name];
				if (!bindings) {
					continue;
				}

				this.__events[name] = Array.prototype.filter.call(bindings, __filterFn);
			}

			return this; // chainable
		},

		trigger: function (events) {
			var args = Array.prototype.slice.call(arguments, 1);

			if (!Array.isArray(events)) {
				events = events.split(EVENT_SPLITTER);
			}

			if (!this.__events) {
				return this; // chainable
			}

			var bindings, binding, i, j, _len, _l;
			for (i = 0, _len = events.length; i < _len; i++) {
				bindings = this.__events[events[i]];
				if (!bindings) {
					continue;
				}
				for (j = 0, _l = bindings.length; j < _l; j++) {
					binding = bindings[j];
					if (binding.options.args === false) {
						binding.callback.call(binding.context);
					} else {
						binding.callback.apply(binding.context, args);
					}
				}
			}

			return this; // chainable
		}
	};

})();

(function () {

"use strict";

Marbles.QueryParams = {
	// transforms a query string into an
	// array of param objects (the first
	// occurance of each param will be
	// placed at index 0, the second at
	// index 1, and so on).
	deserializeParams: function (query) {
		if (query.substr(0, 1) === '?') {
			query = query.substring(1).split('&');
		} else {
			query = query.split('&');
		}

		var params = [{}];
		for (var i = 0, _len = query.length; i < _len; i++) {
			var q = query[i].split('='),
					key = decodeURIComponent(q[0]),
					val = decodeURIComponent(q[1] || '').replace('+', ' ').trim(); // + doesn't decode

			if (typeof val === 'string' && !val) {
				// ignore empty values
				continue;
			}

			if (val.indexOf(',') !== -1) {
				// decode comma delemited values into arrays
				val = val.split(',');
			}

			// loop through param objects until we find one without key
			for (var j = 0, _l = params.length; j < _l; j++) {
				if (params[j].hasOwnProperty(key)) {
					if (j === _l-1) {
						// create additional param objects as needed
						params.push({});
						_l++;
					}
					continue;
				} else {
					params[j][key] = val;
					break;
				}
			}
		}

		return params;
	},

	// function (params, otherParams [, otherParams])
	// combines the first params array with the contents
	// of all the others. nothing is overwritten, duplicates
	// are simply pushed into the next param object they do
	// not comflict with.
	combineParams: function (params) {
		var others = Array.prototype.slice.call(arguments, 1);

		function addValue(key, val) {
			// loop through param objects until we find one without key
			for (var i = 0, _len = params.length; i < _len; i++) {
				if (params[i].hasOwnProperty(key)) {
					if (i === _len-1) {
						// create additional param objects as needed
						params.push({});
						_len++;
					}
					continue;
				} else {
					params[i][key] = val;
					break;
				}
			}
		}

		var key;
		for (var i = 0, _len = others.length; i < _len; i++) {
			for (key in others[i]) {
				if (others[i].hasOwnProperty(key)) {
					addValue(key, others[i][key]);
				}
			}
		}

		return params;
	},

	// function (params, otherParams [, otherParams])
	// combines the first params array with the contents
	// of all the others. duplicates are overwritten if
	// they are at the same params index.
	replaceParams: function (params) {
		var others = Array.prototype.slice.call(arguments, 1);

		function replaceValue(index, key, val) {
			params[index] = params[index] || {};
			params[index][key] = val;
		}

		var key;
		for (var i = 0, _len = others.length; i < _len; i++) {
			for (key in others[i]) {
				if (others[i].hasOwnProperty(key)) {
					replaceValue(i, key, others[i][key]);
				}
			}
		}

		return params;
	},

	// transforms an array of param objects
	// into a query string.
	serializeParams: function (params) {
		var query = [];
		for (var i = 0, _len = params.length; i < _len; i++) {
			for (var key in params[i]) {
				if (params[i].hasOwnProperty(key)) {
					var val = params[i][key];

					if ((typeof val === 'string' && !val) || val === undefined || val === null) {
						// ignore empty values
						continue;
					}

					if (typeof val === 'object' && val.hasOwnProperty('length')) {
						// encode arrays as comma delemited strings
						val = val.join(',');
					}

					query.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
				}
			}
		}

		return "?" + query.join('&');
	}
};

})();






/*
 * * * * * * * * * * * * * * * * * *
 * Inspired by Backbone.js History *
 * * * * * * * * * * * * * * * * * *
 */


(function () {

	"use strict";

	var History = Marbles.Utils.createClass({
		displayName: 'Marbles.History',

		mixins: [Marbles.Events, Marbles.QueryParams],

		willInitialize: function () {
			this.started = false;
			this.handlers = [];
			this.options = {};
			this.path = null;
			this.prevPath = null;

			this.handlePopState = this.handlePopState.bind(this);
		},

		// register route handler
		// handlers are checked in the reverse order
		// they are defined, so if more than one
		// matches, only the one defined last will
		// be called
		route: function (route, name, callback, opts) {
			if (typeof callback !== 'function') {
				throw new Error(this.constructor.displayName + ".prototype.route(): callback is not a function: "+ JSON.stringify(callback));
			}

			if (typeof route.test !== 'function') {
				throw new Error(this.constructor.displayName + ".prototype.route(): expected route to be a RegExp: "+ JSON.stringify(route));
			}

			this.handlers.push({ route: route, name: name, callback: callback, opts: opts });
		},

		// navigate to given path via pushState
		// if available/enabled or by mutation
		// of window.location.href
		//
		// pass options.trigger = false to prevent
		// route handler from being called
		//
		// pass options.replaceState = true to
		// replace the current history item
		//
		// pass options.force = true to force
		// handler to be called even if path is
		// already loaded
		navigate: function (path, options) {
			if (Marbles.history !== this || !this.started) {
				throw new Error("Marbles.history has not been started or is set to a different instance");
			}

			if (!options) {
				options = {};
			}
			if (!options.hasOwnProperty('trigger')) {
				options.trigger = true;
			}
			if (!options.hasOwnProperty('replace')) {
				options.replace = false;
			}
			if (!options.hasOwnProperty('force')) {
				options.force = false;
			}

			if (path[0] === "/") {
				// trim / prefix
				path = path.substring(1);
			}

			if (options.params) {
				path = this.pathWithParams(path, options.params);
			}

			if (path === this.path && !options.force) {
				// we are already there and handler is not forced
				return;
			}

			path = this.pathWithRoot(path);

			if (!this.options.pushState) {
				// pushState is unavailable/disabled
				window.location.href = path;
				return;
			}

			// push or replace state
			var method = 'pushState';
			if (options.replace) {
				method = 'replaceState';
			}
			window.history[method]({}, document.title, path);

			if (options.trigger) {
				// cause route handler to be called
				this.loadURL();
			}
		},

		pathWithParams: function (path, params) {
			if (params.length === 0) {
				return path;
			}

			// clone params array
			params = [].concat(params);
			// we mutate the first param obj, so clone that
			params[0] = Marbles.Utils.extend({}, params[0]);

			// expand named params in path
			path = path.replace(/:([^\/]+)/g, function (m, key) {
				var paramObj = params[0];
				if (paramObj.hasOwnProperty(key)) {
					var val = paramObj[key];
					delete paramObj[key];
					return encodeURIComponent(val);
				} else {
					return ":"+ key;
				}
			});

			// add remaining params to query string
			var queryString = this.serializeParams(params);
			if (queryString.length > 1) {
				if (path.indexOf('?') !== -1) {
					path = path +'&'+ queryString.substring(1);
				} else {
					path = path + queryString;
				}
			}

			return path;
		},

		pathWithRoot: function (path) {
			// add path root if it's not already there
			var root = this.options.root;
			if (root && path.substr(0, root.length) !== root) {
				if (root.substring(root.length-1) !== '/' && path.substr(0, 1) !== '/') {
					// add path seperator if not present in root or path
					path = '/' + path;
				}
				path = root + path;
			}
			return path;
		},

		getURLFromPath: function (path, params) {
			if (params && params.length !== 0) {
				path = this.pathWithParams(path, params);
			}
			return window.location.protocol +'//'+ window.location.host + this.pathWithRoot(path);
		},

		// start pushState handling
		start: function (options) {
			if (Marbles.history && Marbles.history.started) {
				throw new Error("Marbles.history has already been started");
			}

			if (!options) {
				options = {};
			}
			if (!options.hasOwnProperty('trigger')) {
				options.trigger = true;
			}

			if (!Marbles.history) {
				Marbles.history = this;
			}

			this.options = Marbles.Utils.extend({root: '/', pushState: true}, options);
			this.path = this.getPath();

			if (this.options.pushState) {
				// set pushState to false if it's not supported
				this.options.pushState = !!(window.history && window.history.pushState);
			}

			if (this.options.pushState) {
				// init back button binding
				window.addEventListener('popstate', this.handlePopState, false);
			}

			this.started = true;
			this.trigger('start');

			if (options.trigger) {
				this.loadURL();
			}
		},

		// stop pushState handling
		stop: function () {
			if (this.options.pushState) {
				window.removeEventListener('popstate', this.handlePopState, false);
			}
			this.started = false;
			this.trigger('stop');
		},

		getPath: function () {
			var path = window.location.pathname;
			if (window.location.search) {
				path += window.location.search;
			}

			var root = this.options.root.replace(/([^\/])\/$/, '$1');

			if (path.indexOf(root) !== -1) {
				// trim root from path
				path = path.substr(root.length);
			}

			return path.replace(this.constructor.regex.routeStripper, '');
		},

		handlePopState: function () {
			this.checkURL();
		},

		// check if path has changed
		checkURL: function () {
			var current = this.getPath();
			if (current === this.path) {
				// path is the same, do nothing
				return;
			}
			this.loadURL();
		},

		getHandler: function (path) {
			path = path || this.getPath();
			var handler = null;
			for (var i = 0, _len = this.handlers.length; i < _len; i++) {
				if (this.handlers[i].route.test(path)) {
					handler = this.handlers[i];
					break;
				}
			}
			return handler;
		},

		// Attempt to find handler for current path
		// returns matched handler or null
		loadURL: function () {
			this.prevPath = this.path;
			var path = this.path = this.getPath();
			var parts = path.match(this.constructor.regex.routeParts);
			path = parts[1];
			var params = this.deserializeParams(parts[2] || '');

			var handler = this.getHandler(path);

			if (handler) {
				var __handlerAbort = false;
				this.trigger('handler:before', handler, path, params, function () {
					__handlerAbort = true;
				});

				if ( !__handlerAbort ) {
					handler.callback(path, params);
					this.trigger('handler:after', handler, path, params);
				}
			}
			return handler;
		},

	});

	Marbles.History = History;

	History.regex = {
    routeStripper: /^[\/]/,
    routeParts: /^([^?]*)(?:\?(.*))?$/ // 1: path, 2: params
	};

	History.start = function () {
		if (!Marbles.history) {
			Marbles.history = new Marbles.History();
		}
		return Marbles.history.start.apply(Marbles.history, arguments);
	};

})();




/*
 * * * * * * * * * * * * * * * * * *
 * Inspired by Backbone.js Router  *
 * * * * * * * * * * * * * * * * * *
 */


(function () {

	"use strict";

	var Router = Marbles.Utils.createClass({
		displayName: 'Marbles.Router',

		mixins: [Marbles.Events],

		willInitialize: function () {
			this.bindRoutes();
		},

		navigate: function (path, options) {
			return Marbles.history.navigate(path, options);
		},

		// register route handler
		// handler will be called with an array
		// of param objects, the first of which
		// will contain any named params
		route: function (route, handler, opts) {
			if (!Marbles.history) {
				Marbles.history = new Marbles.History();
			}

			var paramNames = [];
			if (typeof route.test !== 'function') {
				paramNames = this.routeParamNames(route);
				route = this.routeToRegExp(route);
			}

			var name;
			if (typeof handler === 'function') {
				name = handler.name || handler.displayName || null;
			} else {
				name = handler;
				handler = this[handler];
			}

			Marbles.history.route(route, name, function (path, params) {
				params = Marbles.QueryParams.combineParams(params, this.extractNamedParams(route, path, paramNames));

				handler.apply(this, [params, opts]);
				this.trigger('route', route, params, opts);
				Marbles.history.trigger('route', this, route, params, opts);

				return this;
			}.bind(this), opts);
		},

		bindRoutes: function () {
			var ctor = this.constructor;
			if (!ctor.routes) {
				throw new Error("You need to define "+ ctor.displayName || ctor.name +".routes");
			}

			var opts, k;
			for (var i = 0, _ref = ctor.routes, _len = _ref.length; i < _len; i++) {
				opts = {};
				for (k in _ref[i]) {
					if (_ref[i].hasOwnProperty(k) && k !== "path" && k !== "handler") {
						opts[k] = _ref[i][k];
					}
				}
				this.route(_ref[i].path, _ref[i].handler, opts);
			}
		},

		routeToRegExp: function (route) {
			if (route[0] === "/") {
				// trim / prefix
				route = route.substring(1);
			}

			var ctor = this.constructor;
			route = route.replace(ctor.regex.escape, '\\$&').
										replace(ctor.regex.namedParam, '([^\/]+)').
										replace(ctor.regex.splatParam, '(.*?)');
			return new RegExp('^' + route + '$');
		},

		routeParamNames: function (route) {
			var ctor = this.constructor;
			var paramNames = [];
			var _ref = route.match(ctor.regex.namedParam);
			if (_ref && _ref.length) {
				for (var i = 0, _len = _ref.length; i < _len; i++) {
					paramNames.push(_ref[i].slice(1));
				}
			}
			_ref = route.match(ctor.regex.splatParam);
			if (_ref && _ref.length) {
				for (i = 0, _len = _ref.length; i < _len; i++) {
					paramNames.push("splat" + (i > 0 ? i+1 : ""));
				}
			}
			return paramNames;
		},

		extractNamedParams: function (route, path, paramNames) {
			var values = [],
					params = {};

			for (var i = 0, _ref = this.extractParams(route, path), _len = _ref.length; i < _len; i++) {
				values.push(decodeURIComponent(_ref[i]));
			}

			for (i = 0, _len = paramNames.length; i < _len; i++) {
				params[paramNames[i]] = values[i];
			}

			return params;
		},

		extractParams: function (route, path) {
			return route.exec(path).slice(1);
		}

	});

	Marbles.Router = Router;

	Router.regex = {
    namedParam: /:\w+/g,
    splatParam: /\*\w*/g,
    escape: /[-[\]{}()+?.,\\^$|#\s]/g
	};

	Router.routes = [];

	Router.createClass = function (proto) {
		if (!proto.hasOwnProperty('displayName')) {
			proto.displayName = this.displayName;
		}
		var routes = this.routes;
		if (proto.hasOwnProperty('routes')) {
			routes = proto.routes;
			delete proto.routes;
		}
		proto.parentClass = this;
		var ctor =  Marbles.Utils.createClass(proto);
		ctor.routes = routes;
		return ctor;
	};

})();



(function () {

	"use strict";

	var KEYPATH_SEP = '.';
	var displayName = 'Marbles.Accessors';

	function parseKeypath(keypath, options) {
		options = options || {};
		var keys;
		if (!options.hasOwnProperty('keypath') || options.keypath === true) {
			keys = keypath.split(KEYPATH_SEP);
		} else {
			keys = [keypath];
		}
		return keys;
	}

	Marbles.Accessors = {
		set: function (keypath, value, options) {
			var keys = parseKeypath(keypath, options);
			var lastKey = keys.pop();
			var ref = this;
			var k, i, _len;
			for (i = 0, _len = keys.length; i < _len; i++) {
				k = keys[i];
				ref[k] = ref[k] || {};
				ref = ref[k];
			}

			var oldValue = ref[lastKey];
			ref[lastKey] = value;
			if (((options || {}).silent !== true) && value !== oldValue && typeof this.trigger === 'function') {
				this.trigger('change', value, oldValue, keypath, options);
				this.trigger('change:'+ keypath, value, oldValue, keypath, options);
			}
		},

		get: function (keypath, options) {
			var keys = parseKeypath(keypath, options);
			var lastKey = keys.pop();
			var ref = this;
			var k, i, _len;
			for (i = 0, _len = keys.length; i < _len; i++) {
				if (!ref) {
					break;
				}
				k = keys[i];
				ref = ref[k];
			}

			if (!ref || !ref.hasOwnProperty(lastKey)) {
				return;
			}

			return ref[lastKey];
		},

		remove: function (keypath, options) {
			if (!this.hasKey(keypath, options)) {
				return;
			}
			var keys = parseKeypath(keypath, options);
			var lastKey = keys.pop();

			var ref = this;
			if (keys.length) {
				ref = this.get(keys.join(KEYPATH_SEP));
			}

			if (!ref) {
				throw new Error(displayName +"("+ this.constructor.displayName +"): Can't remove property "+ JSON.stringify(lastKey) +" from undefined keypath: "+ keys.join(KEYPATH_SEP));
			}

			var oldValue = ref[lastKey];
			if (ref.hasOwnProperty(lastKey)) {
				delete ref[lastKey];
			}

			if (((options || {}).silent !== true) && oldValue !== undefined && typeof this.trigger === 'function') {
				this.trigger('change', undefined, oldValue, keypath, options);
				this.trigger('change:'+ keypath, undefined, oldValue, keypath, options);
			}
		},

		hasKey: function (keypath, options) {
			var keys = parseKeypath(keypath, options);
			var lastKey = keys.pop();
			var ref = this.get(keys.join(KEYPATH_SEP));
			if (!ref || !ref.hasOwnProperty(lastKey)) {
				return false;
			}
			return true;
		}
	};

})();



(function () {

	"use strict";

	Marbles.Transaction = {
		transaction: function (operationFn) {
			var tmp = Object.create(this);

			var eventQueue = [];
			tmp.trigger = function () {
				eventQueue.push(arguments);
			};

			var shouldAbort = false;
			tmp.abortTransaction = function () {
				shouldAbort = true;
			};

			tmp.finalizeTransaction = function () {
				if (shouldAbort) {
					return;
				}

				delete tmp.trigger;
				delete tmp.abortTransaction;
				delete tmp.finalizeTransaction;

				for (var k in tmp) {
					if (tmp.hasOwnProperty(k)) {
						this[k] = tmp[k];
					}
				}

				var args;
				for (var i = 0, len = eventQueue.length; i < len; i++) {
					args = eventQueue.shift();
					this.trigger.apply(this, args);
				}
			}.bind(this);

			if (arguments.length > 0) {
				operationFn.call(tmp, tmp);
				tmp.finalizeTransaction();
			} else {
				return tmp;
			}
		},

		abortTransaction: function () {
			throw new Error("Must be inside a transaction to abort one.");
		},

		finalizeTransaction: function () {
			throw new Error("Must be inside a transaction to finalize one.");
		}
	};

})();



(function () {

	"use strict";

	var assertEqual = function (obj1, obj2) {
		if (obj1 === obj2) {
			return true;
		}

		if (typeof obj1 !== typeof obj2) {
			return false;
		}

		if (!obj1 || !obj2) {
			return false;
		}

		if (typeof obj1 === "object") {
			for (var k in obj1) {
				if (obj1.hasOwnProperty(k)) {
					if ( !assertEqual(obj1[k], obj2[k]) ) {
						return false;
					}
				}
			}

			for (k in obj2) {
				if (obj2.hasOwnProperty(k)) {
					if ( !assertEqual(obj2[k], obj1[k]) ) {
						return false;
					}
				}
			}
			return true;
		} else {
			return obj1 === obj2;
		}
	};

	var calculateDiff = function (keypath, value) {
		var __hasChanges = Marbles.Utils.extend({}, this.__hasChanges);
		if (assertEqual(this.__originalValues[keypath], value)) {
			__hasChanges[keypath] = false;
		} else {
			__hasChanges[keypath] = true;
		}
		this.set("__hasChanges", __hasChanges);
	};

	Marbles.DirtyTracking = {
		willInitialize: function () {
			var keypaths = this.constructor.dirtyTrackingKeypaths;
			if ( !Array.isArray(keypaths) ) {
				throw new Error(this.constructor.displayName +": `dirtyTrackingKeypaths` property (Array) on ctor required, is "+ JSON.stringify(keypaths) +"!");
			}

			this.resetDirtyTracking();

			// track changes
			keypaths.forEach(function (keypath) {
				var __parts = keypath.split('.');
				var __keypath = "";
				__parts.forEach(function (__part) {
					__keypath = __keypath ? (__keypath +"."+ __part) : __part;
					this.on("change:"+ __keypath, function () {
						calculateDiff.call(this, keypath, this.get(keypath));
					}.bind(this));
				}.bind(this));

				// changes via child objects
				this.on("change", function (value, oldValue, kpath) {
					var __value, k;
					if (kpath !== keypath && kpath.substr(0, keypath.length) === keypath) {
						k = kpath.substring(keypath.length+1);
						__value = this.get(keypath);
						calculateDiff.call(this, keypath, __value);
					}
				}.bind(this));
			}.bind(this));
		},

		didInitialize: function () {
			this.resetDirtyTracking();
		},

		proto: {
			resetDirtyTracking: function (keypath) {
				var keypaths;
				if (keypath) {
					keypaths = [keypath];
				} else {
					keypaths = this.constructor.dirtyTrackingKeypaths;
					this.__originalValues = {};
					this.__hasChanges = {};
				}
				keypaths.forEach(function (keypath) {
					this.__originalValues[keypath] = this.get(keypath);
					this.__hasChanges[keypath] = false;
				}.bind(this));
			},

			isDirty: function (keypath) {
				if (keypath) {
					return !!this.__hasChanges[keypath];
				} else {
					for (var k in this.__hasChanges) {
						if (this.__hasChanges.hasOwnProperty(k)) {
							// call isDirty so overriding logic for a single keypath
							// is easier
							if (this.isDirty(k)) {
								return true;
							}
						}
					}
					return false;
				}
			}
		}
	};

})();



(function () {

	"use strict";

	var escapeKeypath = function (keypath) {
		return keypath.replace(".", "_");
	};

	Marbles.Validation = {
		didInitialize: function () {
			var validation = this.constructor.validation;
			if ( !validation ) {
				throw new Error(this.constructor.displayName +": `validation` property (Object) on ctor required, is "+ JSON.stringify(validation) +"!");
			}

			Object.keys(validation).forEach(function (keypath) {
				var __parts = keypath.split('.');
				var __keypath = "";
				__parts.forEach(function (__part) {
					__keypath = __keypath ? (__keypath +"."+ __part) : __part;
					this.on("change:"+ __keypath, function () {
						this.performValidation(keypath, this.get(keypath));
					}.bind(this));
				}.bind(this));

				// changes via child objects
				this.on("change", function (value, oldValue, kpath) {
					var __value, k;
					if (kpath !== keypath && kpath.substr(0, keypath.length) === keypath) {
						k = kpath.substring(keypath.length+1);
						__value = this.get(keypath);
						this.performValidation(keypath, __value);
					}
				}.bind(this));

				var value = this.get(keypath);
				if (value !== undefined) {
					this.performValidation(keypath, value);
				}
			}.bind(this));
		},

		proto: {
			performValidation: function (keypath, value) {
				var key, validator;
				if ( !keypath ) {
					// run all validations
					Object.keys(this.constructor.validation).forEach(function (kpath) {
						this.performValidation(kpath, this.get(kpath));
					}.bind(this));
				} else {
					validator = this.constructor.validation[keypath];
					key = escapeKeypath(keypath);
					validator.call(this, value, function (valid, msg) {
						this.set("validation."+ key +".valid", valid);
						this.set("validation."+ key +".msg", msg);
					}.bind(this));
				}
			},

			getValidation: function (keypath) {
				var key = escapeKeypath(keypath);
				var valid = this.get("validation."+ key +".valid", valid);
				var msg = this.get("validation."+ key +".msg", msg);
				return {
					valid: valid,
					msg: msg
				};
			},

			isValid: function () {
				var valid = true;
				var requiredKeypaths = this.constructor.validationRequiredKeypaths || [];
				for (var i = 0, len = requiredKeypaths.length; i < len; i++) {
					if (this.get(requiredKeypaths[i]) === undefined) {
						valid = false;
						break;
					}
				}
				if (valid) {
					for (var k in this.validation) {
						if (this.validation.hasOwnProperty(k)) {
							if (this.validation[k].valid === false) {
								valid = false;
								break;
							}
						}
					}
				}
				return valid;
			}
		}
	};

})();




(function () {

	"use strict";

	var URI = Marbles.Utils.createClass({
		displayName: 'Marbles.URI',

		mixins: [Marbles.QueryParams],

		willInitialize: function (url, params) {
			this.url = url.trim();
			this.params = params || [{}];

			this.parse();

			this.isURI = true;
		},

		toString: function () {
			var portString = '';
			if (this.port !== 443 && this.port !== 80) {
				portString = ':'+ this.port;
			}

			var schemeString = '';
			if (this.scheme) {
				schemeString = this.scheme + '://';
			}

			var queryString = this.serializeParams(this.params);
			if (queryString === '?') {
				queryString = '';
			}

			var hashString = '';
			if (this.hash) {
				hashString = '#'+ this.hash;
			}

			return (schemeString + this.hostname + portString + this.path + queryString + hashString).replace(/\/$/, '');
		},

		assertEqual: function (uriOrString) {
			var uri = uriOrString;
			if (uriOrString.isURI !== true) {
				uri = new this.constructor(uriOrString);
			}

			return (uri.scheme === this.scheme) && (uri.hostname === this.hostname) && (uri.port === this.port) && (uri.path === this.path) && (uri.params === this.params) && (uri.hash === this.hash);
		},

		parse: function () {
			var m = this.url.match(this.constructor.REGEX);
			this.hostname = m[2] || this.defaultHost();
			this.scheme = (m[1] || this.defaultScheme()).replace(/:\/\/$/, '');
			this.port = Number(m[3]) || this.defaultPort();
			this.path = m[4] || '';
			if (m[5]) {
				var params = this.deserializeParams(m[5]);
				this.replaceParams.apply(this, [this.params].concat(params));
			}
			this.hash = m[6];
		},

		defaultScheme: function () {
			if (typeof window !== 'undefined') {
				return window.location.protocol + '//';
			} else {
				if (this.hostname) {
					return 'http://';
				} else {
					return '';
				}
			}
		},

		defaultHost: function () {
			if (typeof window !== 'undefined') {
				return window.location.hostname;
			} else {
				return '';
			}
		},

		defaultPort: function () {
			if (this.hostname === this.defaultHost() && typeof window !== 'undefined' && window.location.port) {
				return window.location.port;
			} else if (this.scheme === 'https') {
				return 443;
			} else {
				return 80;
			}
		}
	});

	Marbles.URI = URI;

	URI.REGEX = /^(https?:\/\/)?([^\/]+(:\d+)?)?([^\?#]+)?(\?[^#]+)?(#.+)?$/; // $1 = scheme, $2 = hostname, $3 = port, $4 = path, $5 = query, $6 = hash
})();






(function () {

	"use strict";

	Marbles.HTTP = function (options) {
		var request = new Request({
			method: options.method,
			url: options.url,
			params: options.params,
			body: options.body,
			headers: options.headers,
			middleware: options.middleware
		});
		if (typeof options.callback === 'function') {
			request.once('complete', options.callback);
		}
		if ( !request.xhr ) {
			request.open();
			request.send();
		}
		return request;
	};

	var Request = Marbles.Utils.createClass({
		displayName: 'Marbles.HTTPRequest',

		mixins: [Marbles.Events],

		willInitialize: function (options) {
			if (!options) {
				options = {};
			}

			this.middleware = options.middleware || [];

			this.method = options.method || 'GET';
			this.method = this.method.toUpperCase();

			this.uri = new Marbles.URI(options.url, options.params || [{}]);

			this.requestHeaders = options.headers || {};

			this.requestBody = options.body || null;

			if (this.method === 'GET' || this.method === 'HEAD') {
				this.id = this.method +':'+ this.uri.toString();

				// the same request is already in progress
				if (this.constructor.activeRequests[this.id]) {
					return this.constructor.activeRequests[this.id];
				}

				this.on('before:send', this.trackRequest, this);
				this.on('complete', this.untrackRequest, this);
				this.on('terminated', this.untrackRequest, this);
			}

			this.on('before:send', this.callRequestMiddleware, this);
			this.on('before:send', this.setXMLHTTPRequestHeaders, this);

			this.on('before:complete', this.callResponseMiddleware, this);
			this.on('complete', this.untrackRequest, this);
		},

		setRequestHeader: function (key, val) {
			this.requestHeaders[key] = val;
		},

		getRequestHeader: function (key) {
			return this.requestHeaders[key];
		},

		getResponseHeader: function (key) {
			return this.xhr.getResponseHeader(key);
		},

		terminate: function (err) {
			this.terminated = true;
			this.trigger('terminated', err);
		},

		resend: function (err) {
			this.terminate(err || 'resend');
			this.open();
			this.send();
		},

		callRequestMiddleware: function () {
			for (var i = 0, _ref = this.middleware, _len = _ref.length; i < _len; i++) {
				if (this.terminated) {
					break;
				}
				if (typeof _ref[i].willSendRequest === 'function') {
					_ref[i].willSendRequest(this);
				}
			}
		},

		callResponseMiddleware: function () {
			for (var i = 0, _ref = this.middleware, _len = _ref.length; i < _len; i++) {
				if (this.terminated) {
					break;
				}
				if (typeof _ref[i].didReceiveResponse === 'function') {
					_ref[i].didReceiveResponse(this);
				}
			}
		},

		trackRequest: function () {
			this.constructor.activeRequests[this.id] = this;
		},

		untrackRequest: function () {
			if (this.constructor.activeRequests.hasOwnProperty(this.id)) {
				delete this.constructor.activeRequests[this.id];
			}
		},

		setXMLHTTPRequest: function () {
			this.xhr = new XMLHttpRequest();
			this.xhr.onreadystatechange = this.handleReadyStateChange.bind(this);
		},

		setXMLHTTPRequestHeaders: function () {
			for (var key in this.requestHeaders) {
				if (this.requestHeaders.hasOwnProperty(key)) {
					this.xhr.setRequestHeader(key, this.requestHeaders[key]);
				}
			}
		},

		handleReadyStateChange: function () {
			if (this.xhr.readyState !== 4) {
				return;
			}

			this.trigger('before:complete', this.xhr);

			var responseData = this.responseData || this.xhr.response;
			if (this.xhr.status >= 200 && this.xhr.status < 400 && this.xhr.status !== 0) {
				this.trigger('success', responseData, this.xhr);
			} else {
				this.trigger('failure', responseData, this.xhr);
			}

			this.trigger('complete', responseData, this.xhr);
		},

		open: function () {
			// The request is already open
			if (this.xhr && this.xhr.readyState !== 4) {
				return;
			}

			this.setXMLHTTPRequest();
			var url = this.uri.toString();
			var async = true;
			this.xhr.open(this.method, url, async);
			this.trigger('open', this.method, url, async);
		},

		send: function () {
			if (this.xhr.readyState !== 1) {
				return;
			}

			var send = function () {
				this.trigger('before:send');
				if (this.multipart === true) {
					if (typeof this.xhr.sendAsBinary !== 'function') {
						throw new Error(this.constructor.displayName +': '+ this.xhr.constructor.name +'.prototype.sendAsBinary is not a function!');
					}
					this.xhr.sendAsBinary(this.requestBody);
				} else {
					try {
						this.xhr.send(this.requestBody);
					} catch (e) {
						setTimeout(function () {
							throw e;
						}, 0);
					}
				}
				this.trigger('after:send');
			}.bind(this);

			if (this.body && Array.isArray(this.body)) {
				this.setRequestHeader('Content-Type', 'multipart/form-data; boundary='+ this.constructor.MULTIPART_BOUNDARY);
				this.multipart = true;
				this.buildMultipartRequestBody(send);
			} else {
				send();
			}
		},

		buildMultipartRequestBody: function (done) {
			var startBoundary = "--"+ this.constructor.MULTIPART_BOUNDARY +"\r\n";
			var closeBoundary = "--"+ this.constructor.MULTIPART_BOUNDARY +"--";
			var parts = [];
			var numPendingParts = this.body.length;

			function readAsBinaryString(blob, callback) {
				var reader = new FileReader();
				reader.onload = function (e) {
					callback(e.target.result);
				};
				reader.readAsBinaryString(blob);
			}

			function addPart(data) {
				if (data) {
					parts.push(data);
				}
				numPendingParts--;

				if (numPendingParts === 0) {
					this.body = startBoundary;
					this.body += parts.join(startBoundary);
					this.body += closeBoundary;
					done();
				}
			}

			function buildAndAddPart(part) {
				var name = part[0];
				var blob = part[1];
				var filename = part[2];
				var data = [
					'Content-Disposition: form-data; name="'+ name +'"; filename="'+ filename +'"',
					'Content-Type: '+ (blob.type || 'application/octet-stream'),
					'Content-Length: '+ blob.size,
				].join('\r\n');

				readAsBinaryString(blob, function(str) {
					data += str +'\r\n';
					addPart(data);
				});
			}

			for (var i = 0, _len = this.body.length; i < _len; i++) {
				buildAndAddPart(this.body[i]);
			}
		}
	});

	Marbles.HTTPRequest = Request;

	Request.MULTIPART_BOUNDARY = "-----------REQUEST_PART";

	Request.activeRequests = {};

})();



Marbles.HTTP.Middleware = Marbles.HTTP.Middleware || {};




(function () {

	"use strict";

	var CONTENT_TYPE = 'application/x-www-form-urlencoded';

	Marbles.HTTP.Middleware.FormEncoded = {
		willSendRequest: function (request) {
			if (request.multipart) {
				return;
			}

			if (!request.requestBody) {
				return;
			}

			var contentType = request.getRequestHeader('Content-Type');
			if (contentType !== CONTENT_TYPE) {
				return;
			}

			var params = request.requestBody;
			if (!Array.isArray(params)) {
				params = [params];
			}
			request.requestBody = Marbles.QueryParams.serializeParams(params).substring(1);
		},

		didReceiveResponse: function (request) {
			var contentType = request.getResponseHeader('Content-Type');
			if (contentType !== CONTENT_TYPE) {
				return;
			}

			var response = request.xhr.response;
			var responseData = null;
			if (!response || typeof response !== 'string') {
				return;
			}

			if (!Array.isArray(responseData)) {
				responseData = [responseData];
			}

			request.responseData = Marbles.QueryParams.deserializeParams(responseData);
		}
	};

})();



(function () {

"use strict";

Marbles.HTTP.Middleware.SerializeJSON = {
	willSendRequest: function (request) {
		if (request.multipart) {
			return;
		}

		var contentType = request.getRequestHeader('Content-Type');
		if (!/\bjson/i.test(contentType)) {
			return;
		}

		var requestBody = request.requestBody;
		request.requestBody = requestBody ? JSON.stringify(requestBody) : null;
	},

	didReceiveResponse: function (request) {
		var contentType = request.getResponseHeader('Content-Type');
		if (!/\bjson/i.test(contentType)) {
			return;
		}

		var responseData = request.xhr.response;
		request.responseData = null;
		if (responseData) {
			try {
				request.responseData = JSON.parse(responseData);
			} catch (err) {
				request.terminate(err);
			}
		}
	}
};

})();



(function () {

"use strict";

Marbles.HTTP.Middleware.WithCredentials = {
	willSendRequest: function (request) {
		try {
			request.xhr.withCredentials = true;
		} catch (e) {
			setTimeout(function () {
				throw e;
			}, 0);
		}
	}
};

})();





(function () {

	"use strict";

	var LINK_SPLITTER = /,[\s\r\n]*/;
	var LINK_MATCHER = /<([^>]+)>((?:[\s\r\n]|.)*)/;
	var ATTR_SPLITTER = /[\s\r\n]*;[\s\r\n]*/;
	var ATTR_MATCHER = /([^=]+)=['"]?([^'"]+)['"]?/;

	Marbles.HTTP = Marbles.HTTP || {};
	Marbles.HTTP.LinkHeader = {
		parse: function (linkHeaderStr) {
			var links = [];
			var ref = linkHeaderStr.split(LINK_SPLITTER);
			var i, _len, match, link;
			var j, _r, _l;
			for (i = 0, _len = ref.length; i < _len; i++) {
				match = ref[i].match(LINK_MATCHER);
				if (!match) {
					continue;
				}

				link = {
					href: match[1]
				};
				_r = match[2].split(ATTR_SPLITTER);
				for (j = 0, _l = _r.length; j < _l; j++) {
					match = _r[j].match(ATTR_MATCHER);
					if (!match) {
						continue;
					}

					link[match[1]] = match[2];
				}

				links.push(link);
			}

			return links;
		}
	};

})();






(function () {

"use strict";

Marbles.Object = Marbles.Utils.createClass({
	displayName: 'Marbles.Object',

	mixins: [Marbles.Accessors, Marbles.Events],

	willInitialize: function (attrs) {
		this.parseAttributes(attrs);
	},

	parseAttributes: function (attrs) {
		for (var k in attrs) {
			if (attrs.hasOwnProperty(k)) {
				this.set(k, attrs[k]);
			}
		}
	}
});

})();



(function () {

	"use strict";

	var IDCounter = Marbles.Utils.createClass({
		displayName: 'Marbles.IDCounter',

		willInitialize: function (scope, initialCount) {
			if (!initialCount) {
				initialCount = 0;
			}

			this.scope = scope;
			this.count = initialCount;
		},

		incrementCounter: function () {
			return this.count++;
		},

		nextID: function () {
			return this.scope + '_' + this.incrementCounter();
		}

	});

	Marbles.IDCounter = IDCounter;

	IDCounter.counterScopeMapping = {};
	IDCounter.counterForScope = function (scope) {
		var counter = this.counterScopeMapping[scope];
		if (!counter) {
			counter = new this(scope);
			this.counterScopeMapping[scope] = counter;
		}
		return counter;
	};

})();





(function () {

	"use strict";

	var __generateCIDName,
			__buildCIDMappingScope,
			__trackInstance,
			__updateCIDMapping;

	Marbles.CIDMapping = {

		didExtendCtor: function (ctor) {
			// instance cid mapping
			// (cid -> instance)
			ctor.instances = {};

			// instance lookup mapping
			// (lookup key -> cid)
			ctor.__cidMapping = {};

			// used to generate instance lookup key
			if (ctor.cidMappingScope === undefined) {
				ctor.cidMappingScope = [];
			}

			// generated from cidScope
			// used for cidCounter
			if (ctor.cidScope) {
				ctor.__cidName = __generateCIDName.call(ctor);
			} else {
				ctor.__cidName = '_default';
			}

			// used to generate instance cid
			ctor.__cidCounter = new Marbles.IDCounter(ctor.__cidName);
		},

		ctor: {
			find: function (params, options) {
				var _cidMappingScope = __buildCIDMappingScope.call(this, params),
						_cidMapping = this.__cidMapping,
						_cidName = this.__cidName,
						_cid, _instance,
						_should_fetch = (!options || options.fetch !== false);

				if (!options) {
					options = {};
				}

				if (params.hasOwnProperty('cid')) {
					_cid = params.cid;
					_should_fetch = false;
				} else {
					if (_cidMappingScope) {
						_cid = (_cidMapping[_cidName] || {})[_cidMappingScope];
					}
				}

				if (_cid !== undefined && _cid !== null) {
					_instance = this.instances[_cid];
					if (_instance) {
						return _instance;
					}
				}

				if (_should_fetch === true) {
					this.fetch(params, options);
				}

				return null;
			},

			findOrNew: function (attrs) {
				var model = this.find(attrs, {fetch:false});
				if ( !model ) {
					model = new this(attrs);
				}
				return model;
			},

			fetch: function () {
				throw new Error("You need to define " + this.displayName + ".fetch(params, options)");
			},

			detach: function (cid) {
				var _instances = this.instances,
						_instance = _instances[cid],
						_cidName = this.__cidName,
						_cidMapping = this.__cidMapping,
						_index, _tmp;

				if (_instance && _instance.willDetach) {
					_instance.willDetach();
				}

				if (_instances.hasOwnProperty(cid)) {
					delete _instances[cid];
				}
				if (_cidMapping.hasOwnProperty(cid)) {
					delete _cidMapping[cid];
				}

				if (_instances[_cidName]) {
					_index = _instances[_cidName].indexOf(cid);
					if (_index !== -1) {
						_tmp = _instances[_cidName];
						_tmp = _tmp.slice(0, _index).concat(
							_tmp.slice(_index + 1, _tmp.length)
						);
						_instances[_cidName] = _tmp;
					}
				}

				if (_instance) {
					_instance.trigger('detach');
					if (_instance.didDetach) {
						_instance.didDetach();
					}
				}
				this.trigger('detach', cid, _instance);

				// clear all event bindings
				this.off();
			}
		},

		proto: {
			initCIDMapping: function () {
				if (this.cid === undefined) {
					this.cid = this.constructor.__cidCounter.nextID();
				}

				__trackInstance.call(this);
			},

			detach: function () {
				this.constructor.detach(this.cid);
			}
		}

	};

	__generateCIDName = function () {
		var _parts = [],
				i,
				_ref = this.cidScope,
				_len;
		for (i = 0, _len = _ref.length; i < _len; i++) {
			_parts.push(this[ _ref[i] ]);
		}
		return _parts.join(':');
	};

	__buildCIDMappingScope = function (attrs) {
		var _scope = [],
				i,
				_ref = this.cidMappingScope,
				_len;
		for (i = 0, _len = _ref.length; i < _len; i++) {
			if ( !attrs.hasOwnProperty(_ref[i]) ) {
				// Can't build a partial scope
				return null;
			} else {
				_scope.push(attrs[ _ref[i] ]);
			}
		}
		return _scope.join(':');
	};

	__trackInstance = function () {
		var _ctor = this.constructor,
				_instances = _ctor.instances,
				_cidMappingScope = _ctor.cidMappingScope,
				i, _len;

		_instances[this.cid] = this;

		for (i = 0, _len = _cidMappingScope.length; i < _len; i++) {
			this.on('change:'+ _cidMappingScope[i], __updateCIDMapping, this);
		}
	};

	__updateCIDMapping = function (new_val, old_val, attr) {
		var _old_scope = [],
				_new_scope = [],
				_ctor = this.constructor,
				_cidMapping = _ctor.__cidMapping,
				_cidName = _ctor.__cidName,
				i, _ref, _len, _val;

		_ref = _ctor.cidMappingScope;
		for (i = 0, _len = _ref.length; i < _len; i++) {
			if (_ref[i] === attr) {
				_old_scope.push(old_val);
				_new_scope.push(new_val);
			} else {
				_val = this.get(_ref[i]);
				_old_scope.push(_val);
				_new_scope.push(_val);
			}
		}

		_old_scope = _old_scope.join(':');
		_new_scope = _new_scope.join(':');

		if (_cidMapping[_cidName] === undefined) {
			_cidMapping[_cidName] = {};
		}
		_cidMapping[_cidName][_new_scope] = this.cid;
		if (_cidMapping[_cidName].hasOwnProperty(_old_scope)) {
			delete _cidMapping[_cidName][_old_scope];
		}
	};

})();








(function () {

"use strict";

Marbles.Model = Marbles.Utils.createClass({
	displayName: 'Marbles.Model',

	mixins: [
		// Add some properties to ctor
		{
			ctor: {
				modelName: 'model',
				cidScope: ['modelName'],
				cidMappingScope: ['id'],
				JSONKeys: 'all'
			}
		},

		// Make ctor and proto evented
		{
			ctor: Marbles.Events,
			proto: Marbles.Events
		},

		// Extend ptoto with accessor methods
		Marbles.Accessors,

		// Extend proto with transaction method
		Marbles.Transaction,

		// CIDMapping extends both ctor and proto
		Marbles.CIDMapping
	],

	willInitialize: function (attrs, options) {
		if (!attrs) {
			attrs = {};
		}

		if (!options) {
			options = {};
		}

		if (options.cid) {
			this.cid = options.cid;
		}

		this.initCIDMapping();

		this.transaction(function () {
			this.parseAttributes(attrs);
		});

		return this;
	},

	parseAttributes: function (attrs) {
		for (var k in attrs) {
			if (attrs.hasOwnProperty(k)) {
				this.set(k, attrs[k], {keypath: false});
			}
		}
	},

	toJSON: function () {
		var keys, attrs = {}, i, _len, k;

		if (this.constructor.JSONKeys === 'all') {
			keys = Object.keys(this);
		} else {
			keys = this.constructor.JSONKeys;
		}

		for (i = 0, _len = keys.length; i < _len; i++) {
			k = keys[i];
			if (this.hasOwnProperty(k)) {
				attrs[k] = this[k];
			}
		}

		return attrs;
	}
});

})();




(function () {

"use strict";

Marbles.Collection = Marbles.Utils.createClass({
	displayName: 'Marbles.Collection',

	mixins: [
		// Add some properties to ctor
		{
			ctor: {
				collectionName: 'collection',
				cidScope: ['collectionName'],
				model: Marbles.Model,

				buildModel: function (attrs, options) {
					var ModelCtor = (options || {}).model || this.model,
							_instance = ModelCtor.find(attrs, {fetch:false});
					if (_instance) {
						_instance.parseAttributes(attrs);
					} else {
						_instance = new ModelCtor(attrs);
					}
					return _instance;
				}
			}
		},

		// Make ctor and proto evented
		{
			ctor: Marbles.Events,
			proto: Marbles.Events
		},

		// Extend ptoto with accessor methods
		Marbles.Accessors,

		// CIDMapping extends both ctor and proto
		Marbles.CIDMapping
	],

	willInitialize: function (options) {
		this.modelCIDs = [];

		this.options = {
			unique: !!options.unique
		};

		if (options.cid) {
			this.cid = options.cid;
		}
		this.initCIDMapping();

		this.watchModelMortality();

		this.on("reset prepend append remove", function () {
			this.trigger("change:models", this.models);
		}, this);
	},

	watchModelMortality: function () {
		this.constructor.model.on('detach', function (cid) {
			this.removeCIDs([cid]);
		}, this);
	},

	indexOf: function (model) {
		return this.modelCIDs.indexOf(model.cid);
	},

	first: function () {
		return this.constructor.model.find({cid: this.modelCIDs[0]});
	},

	last: function () {
		return this.constructor.model.find({cid: this.modelCIDs[this.modelCIDs.length-1]});
	},

	forEach: function (callback, thisArg) {
		var _ref = this.modelCIDs,
				model;
		for (var i = 0, _len = _ref.length; i < _len; i++) {
			model = this.constructor.model.find({cid: _ref[i]});
			if (model) {
				callback.call(thisArg || this, model, i);
			}
		}
	},

	models: function () {
		var _ref = this.modelCIDs,
				models = [],
				model;
		for (var i = 0, _len = _ref.length; i < _len; i++) {
			model = this.constructor.model.find({cid: _ref[i]});
			if (model) {
				models.push(model);
			}
		}
		return models;
	},

	resetJSON: function (json, options) {
		if (!options) {
			options = {};
		}
		this.modelCIDs = [];
		var models = this.appendJSON(json, {silent:true});
		if (!options.silent) {
			this.trigger('reset', models);
		}
		return models;
	},

	resetModels: function (models, options) {
		if (!options) {
			options = {};
		}
		this.modelCIDs = [];
		models = this.appendModels(models, {silent:true});
		if (!options.silent) {
			this.trigger('reset', models);
		}
		return models;
	},

	reset: function (options) {
		if (!options) {
			options = {};
		}
		this.modelCIDs = [];
		if (!options.silent) {
			this.trigger('reset', []);
		}
	},

	removeAtIndex: function (cidIndex) {
		var cid = this.modelCIDs[cidIndex];
		this.modelCIDs = this.modelCIDs.slice(0, cidIndex).concat(
			this.modelCIDs.slice(cidIndex + 1, this.modelCIDs.length)
		);
		this.trigger('remove', cid);
		return this.modelCIDs.length;
	},

	removeCIDs: function (cids) {
		var index;
		for (var i = 0, _len = cids.length; i < _len; i++) {
			index = this.modelCIDs.indexOf(cids[i]);
			if (index === -1) {
				continue;
			}
			this.removeAtIndex(index);
		}
		return this.modelCIDs.length;
	},

	remove: function () {
		var models = Array.prototype.slice.call(arguments, 0);
		for (var i = 0, _len = models.length; i < _len; i++) {
			this.removeCIDs([models[i].cid]);
		}
		return this.modelCIDs.length;
	},

	prependJSON: function (json, options) {
		if (!json || !json.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var models = [], model;
		for (var i = json.length-1; i >= 0; i--) {
			model = this.constructor.buildModel(json[i]);
			if (!this.options.unique || this.modelCIDs.indexOf(model.cid) === -1) {
				this.modelCIDs.unshift(model.cid);
				models.unshift(model);
			}
		}

		if (!options.silent) {
			this.trigger('prepend', models);
		}

		return models;
	},

	prependModels: function (models, options) {
		if (!models || !models.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var acceptedModels = [], model;
		for (var i = models.length-1; i >= 0; i--) {
			model = models[i];
			if (!this.options.unique || this.modelCIDs.indexOf(model.cid) === -1) {
				this.modelCIDs.unshift(model.cid);
				acceptedModels.unshift(model);
			}
		}

		if (!options.silent) {
			this.trigger('prepend', acceptedModels);
		}

		return acceptedModels;
	},

	prependCIDs: function (cids, options) {
		if (!cids || !cids.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var acceptedModels = [], cid, model;
		for (var i = cids.length; i >= 0; i--) {
			cid = cids[i];
			if (!this.options.unique || this.modelCIDs.indexOf(cid) === -1) {
				model = this.constructor.find({cid: cid});
				if (!model) {
					continue;
				}
				this.modelCIDs.unshift(cid);
				acceptedModels.unshift(model);
			}
		}

		if (!options.silent) {
			this.trigger('prepend', acceptedModels);
		}

		return acceptedModels;
	},

	unshift: function () {
		return this.prependModels(Array.prototype.slice.call(arguments, 0));
	},

	appendJSON: function (json, options) {
		if (!json || !json.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var models = [], model;
		for (var i = 0, _len = json.length; i < _len; i++) {
			model = this.constructor.buildModel(json[i]);
			if (!this.options.unique || this.modelCIDs.indexOf(model.cid) === -1) {
				this.modelCIDs.push(model.cid);
				models.push(model);
			}
		}

		if (!options.silent) {
			this.trigger('append', models);
		}

		return models;
	},

	appendModels: function (models, options) {
		if (!models || !models.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var acceptedModels = [], model;
		for (var i = 0, _len = models.length; i < _len; i++) {
			model = models[i];
			if (!this.options.unique || this.modelCIDs.indexOf(model.cid) === -1) {
				this.modelCIDs.push(model.cid);
				acceptedModels.push(model);
			}
		}

		if (!options.silent) {
			this.trigger('append', acceptedModels);
		}

		return acceptedModels;
	},

	appendCIDs: function (cids, options) {
		if (!cids || !cids.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var acceptedModels = [], cid, model;
		for (var i = 0, _len = cids.length; i < _len; i++) {
			cid = cids[i];
			if (!this.options.unique || this.modelCIDs.indexOf(cid) === -1) {
				model = this.constructor.find({cid: cid});
				if (!model) {
					continue;
				}
				this.modelCIDs.push(cid);
				acceptedModels.push(model);
			}
		}

		if (!options.silent) {
			this.trigger('append', acceptedModels);
		}

		return acceptedModels;
	},

	push: function () {
		return this.appendModels(Array.prototype.slice.call(arguments, 0));
	}
});

})();


















