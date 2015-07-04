/* @flow weak */
/**
 * @global
 * @namespace Marbles
 */

(function(__m__) {
 "use strict";
 __m__["marbles/version"] = {};
 /* @flow weak */
 /**
  * @global
  * @namespace Marbles
  */

 var VERSION = '0.0.5';

 if (true) {
  __m__["marbles/version"].VERSION = VERSION;
 }
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/utils"] = {};
    /* @flow weak */

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


    /**
     * @memberof Marbles
     * @namespace Utils
     */
    var Utils = {
        /**
         * @memberof Marbles.Utils
         * @func
         * @param {Object} obj The object to extend
         * @param {...Object} other One or more objects to extend it with
         */
        extend: function (obj) {
            var others = Array.prototype.slice.call(arguments, 1);
            return __extend(obj, others, {override: true});
        },

        lazyExtend: function (obj) {
            var others = Array.prototype.slice.call(arguments, 1);
            return __extend(obj, others, {override: false});
        },

        /**
         * @memberof Marbles.Utils
         * @func
         * @param {*} obj
         * @param {*} otherObj
         * @returns {bool}
         * @desc compare two objects of any type
         */
        assertEqual: function (obj, other) {
            if (typeof obj !== typeof other) {
                return false;
            }
            if (typeof obj !== "object") {
                return obj === other;
            }
            if (Array.isArray(obj)) {
                if ( !Array.isArray(other) ) {
                    return false;
                }
                if (obj.length !== other.length) {
                    return false;
                }
                for (var i = 0, len = obj.length; i < len; i++) {
                    if ( !this.assertEqual(obj[i], other[i]) ) {
                        return false;
                    }
                }
                return true;
            }
            // both ids are objects
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    if (obj[k] !== other[k]) {
                        return false;
                    }
                }
            }
            for (k in other) {
                if (other.hasOwnProperty(k)) {
                    if (other[k] !== obj[k]) {
                        return false;
                    }
                }
            }
            return true;
        },


        /**
         * @memberof Marbles.Utils
         * @func
         * @param {Class} child
         * @param {Class} parent
         * @returns {Class} child
         * @private
         * @desc The prototype of child is made to inherit from parent.
         *	A `__super__` property is added to the child constructor to access the parent prototype.
         */
        inheritPrototype: function(child, parent) {
            Utils.extend(child, parent);

            function Ctor() {
                this.constructor = child;
            }
            Ctor.prototype = parent.prototype;
            child.prototype = new Ctor();
            child.__super__ = parent.prototype;
            return child;
        },

        /**
         * @memberof Marbles.Utils
         * @func
         * @param {Object} proto
         * @returns {Class} ctor
         * @desc Creates a constructor with given prototype
         * @example
         *	Utils.createClass({
         *		displayName: "MyClass", // ctor.displayName
         *
         *		// Array of objects to mix-into prototype
         *		mixins: [
         *			Marbles.State
         *		],
         *
         *		parentClass: MyOtherClass, // inherit from MyOtherClass (optional)
         *
         *		willInitialize: function () {}, // called before parent ctor is called
         *
         *		didInitialize: function () {}, // called after parent ctor is called
         *
         *		myProperty: 123 // no special meaning
         *	});
         */
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

                Utils.inheritPrototype(ctor, parent);
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
                var _child_ctor = Utils.createClass(Utils.extend({}, proto, {
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
                        Utils.extend(ctor, mixin.ctor);

                        if (typeof mixin.didExtendCtor === 'function') {
                            mixin_callbacks.didExtendCtor.push(mixin.didExtendCtor);
                            mixin.didExtendCtor(ctor);
                        }
                    }

                    // extend proto
                    if (mixin.hasOwnProperty('proto')) {
                        Utils.extend(ctor.prototype, mixin.proto);

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
                    Utils.extend(ctor.prototype, mixin);
                }
            }

            return ctor;
        }
    };

    var extend = Utils.extend;
    var lazyExtend = Utils.lazyExtend;
    var assertEqual = Utils.assertEqual;
    var createClass = Utils.createClass;

    if (true) {
        __m__["marbles/utils"].extend = extend;
        __m__["marbles/utils"].lazyExtend = lazyExtend;
        __m__["marbles/utils"].assertEqual = assertEqual;
        __m__["marbles/utils"].createClass = createClass;
    }

    __m__["marbles/utils"].default = Utils;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/dispatcher"] = {};
    /* @flow weak */

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

    __m__["marbles/dispatcher"].default = Dispatcher;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */
/**
 * @memberof Marbles
 * @mixin
 * @desc Manages a state object. You must define `state` {Object} and `__changeListeners` {Array} on the object this is mixed into.
 */

(function(__m__) {
    "use strict";
    __m__["marbles/state"] = {};
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

    __m__["marbles/state"].default = State;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/store"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;
    var State = __m__["marbles/state"].State || __m__["marbles/state"].default;

    /**
     * @memberof Marbles
     * @class
     * @param {*} id Anything serializable as JSON
     * @desc This class is meant to be sub-classed using Store.createClass
     */
    var Store = function (id) {
        this.id = id;
        this.constructor.__trackInstance(this);

        this.__changeListeners = [];

        this.willInitialize.apply(this, Array.prototype.slice.call(arguments, 1));

        this.state = this.getInitialState();

        this.didInitialize.apply(this, Array.prototype.slice.call(arguments, 1));
    };

    Store.displayName = "Marbles.Store";

    Utils.extend(Store.prototype, State, {
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
        State.addChangeListener.apply(this, arguments);
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
        State.removeChangeListener.apply(this, arguments);
        if (this.__changeListeners.length === 0 && !this.__changeListenerExpected) {
            Promise.resolve(this.didBecomeInactive()).then(done);
        }
    };

    Store.prototype.expectChangeListener = function () {
        this.__changeListenerExpected = true;
    };

    Store.prototype.unexpectChangeListener = function () {
        this.__changeListenerExpected = false;
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
        var store = Utils.inheritPrototype(function () {
            parent.apply(this, arguments);
        }, parent);

        store.__instances = {};

        if (proto.hasOwnProperty("displayName")) {
            store.displayName = proto.displayName;
            delete proto.displayName;
        }

        Utils.extend(store.prototype, proto);

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

    __m__["marbles/store"].default = Store;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/events"] = {};
    /* @flow weak */

    var EVENT_SPLITTER = /\s+/;

    function initEvents(obj) {
        if (!obj.__events) {
            obj.__events = {};
        }
    }

    /**
     * @deprecated Use the Dispatcher instead
     * @see Marbles.Dispatcher
     * @memberof Marbles
     * @mixin
     */
    var Events = {
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

    __m__["marbles/events"].default = Events;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */
/**
 * @memberof Marbles
 * @mixin
 */

(function(__m__) {
    "use strict";
    __m__["marbles/query_params"] = {};
    /* @flow weak */
    /**
     * @memberof Marbles
     * @mixin
     */

    var QueryParams = {
        /**
         * @method
         * @param {String} queryString
         * @returns {Array} params
         * @desc transforms a query string into an array of param objects (the first occurance of each param will be placed at index 0, the second at index 1, and so on).
         * @example
         *	Marbles.QueryParams.deserializeParams("?a=1&b=2&c=3");
         *	//=> [{a: 1, b:2, c:3}]
         * @example
         *	Marbles.QueryParams.deserializeParams("a=1&b=2&c=3");
         *	//=> [{a: 1, b:2, c:3}]
         * @example
         *	Marbles.QueryParams.deserializeParams("?a=1&a=2&b=3&c=4&c=5");
         *	//=> [{a: 1, b:3, c:4}, {a: 2, c: 5}]
         */
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

        /**
         * @method
         * @desc Combines the first params array with the contents of all the others. Duplicate params are pushed into the next param object they do not comflict with. The mutated params array is returned.
         * @param {Array} params An array of param objects
         * @param {...Object} others Any number of param objects
         * @retuns {Array} params
         */
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

        /**
         * @method
         * @desc Combines the first params array with the contents of all the others. Duplicate params are overwritten if they are at the same params index.
         * @param {Array} params An array of param objects
         * @param {...Object} others Any number of param objects
         * @retuns {Array} params
         */
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

        /**
         * @method
         * @desc Transforms an array of param objects into a query string.
         * @param {Array} params An array of param objects
         * @retuns {String} queryString
         * @example
         *	Marbles.QueryParams.serializeParams([{a:1, b:2}, {a:3, b:4}]);
         *	//= "?a=1&b=2&a=3&b=4"
         */
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

    __m__["marbles/query_params"].default = QueryParams;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/history"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;
    var Dispatcher = __m__["marbles/dispatcher"].Dispatcher || __m__["marbles/dispatcher"].default;
    var QueryParams = __m__["marbles/query_params"].QueryParams || __m__["marbles/query_params"].default;

    /*
     * * * * * * * * * * * * * * * * * *
     * Inspired by Backbone.js History *
     * * * * * * * * * * * * * * * * * *
     */

    var pathWithParams = function (path, params) {
        if (params.length === 0) {
            return path;
        }

        // clone params array
        params = [].concat(params);
        // we mutate the first param obj, so clone that
        params[0] = Utils.extend({}, params[0]);

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
        var queryString = QueryParams.serializeParams(params);
        if (queryString.length > 1) {
            if (path.indexOf('?') !== -1) {
                path = path +'&'+ queryString.substring(1);
            } else {
                path = path + queryString;
            }
        }

        return path;
    };

    /**
     * @memberof Marbles
     * @class
     * @see Marbles.Router
     */
    var History = Utils.createClass({
        displayName: 'Marbles.History',

        willInitialize: function () {
            this.started = false;
            this.handlers = [];
            this.options = {};
            this.path = null;
            this.prevPath = null;

            this.handlePopState = this.handlePopState.bind(this);
        },

        // register router
        register: function (router) {
            router.history = this;
            router.routes.forEach(function (route) {
                this.route(
                    route.route,
                    route.name,
                    route.handler,
                    route.paramNames,
                    route.opts,
                    router
                );
            }.bind(this));
        },

        // register route handler
        // handlers are checked in the reverse order
        // they are defined, so if more than one
        // matches, only the one defined last will
        // be called
        route: function (route, name, callback, paramNames, opts, router) {
            if (typeof callback !== 'function') {
                throw new Error(this.constructor.displayName + ".prototype.route(): callback is not a function: "+ JSON.stringify(callback));
            }

            if (typeof route.test !== 'function') {
                throw new Error(this.constructor.displayName + ".prototype.route(): expected route to be a RegExp: "+ JSON.stringify(route));
            }

            this.handlers.push({
                route: route,
                name: name,
                paramNames: paramNames,
                callback: callback,
                opts: opts,
                router: router
            });
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
            if (!this.started) {
                throw new Error("history has not been started");
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
                path = pathWithParams(path, options.params);
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
                this.loadURL({ replace: options.replace });
            }
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
                path = pathWithParams(path, params);
            }
            return window.location.protocol +'//'+ window.location.host + this.pathWithRoot(path);
        },

        /**
         * @func
         * @param {Object} options
         * @desc Starts listenening to pushState events and calls route handlers when appropriate
         * @example
         *	import History from "marbles/history";
         *	new History().start({
         *		root: "/", // if your app is mounted anywhere other than the domain root, enter the path prefix here
         *		pushState: true, // set to `false` in the unlikely event you wish to disable pushState (falls back to manipulating window.location)
         *		dispatcher: Marbles.Dispatcher // The Dispatcher all events are passed to
         *	});
         */
        start: function (options) {
            if (this.started) {
                throw new Error("history has already been started");
            }

            if (!options) {
                options = {};
            }
            if (!options.hasOwnProperty('trigger')) {
                options.trigger = true;
            }

            this.dispatcher = options.dispatcher || Dispatcher;

            this.context = options.context || {};

            this.options = Utils.extend({root: '/', pushState: true}, options);
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
            path = path.split('?')[0];
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
        loadURL: function (options) {
            options = options || {};
            var prevPath = this.path;
            var prevParams = this.pathParams;
            if ( !options.replace ) {
                this.prevPath = prevPath;
                this.prevParams = prevParams;
            }

            var path = this.path = this.getPath();
            var parts = path.match(this.constructor.regex.routeParts);
            path = parts[1];
            var params = QueryParams.deserializeParams(parts[2] || '');
            this.pathParams = params;

            var prevHandler;
            if (this.path !== this.prevPath) {
                prevHandler = this.getHandler(prevPath);
            }
            var handler = this.getHandler(path);

            var __handlerAbort = false;
            var handlerAbort = function () {
                __handlerAbort = true;
            };

            if (prevHandler) {
                var handlerUnloadEvent = {
                    handler: prevHandler,
                    nextHandler: handler,
                    path: prevPath,
                    nextPath: path,
                    params: prevParams,
                    nextParams: params,
                    abort: handlerAbort,
                    context: this.context
                };
                if (prevHandler.router.beforeHandlerUnload) {
                    prevHandler.router.beforeHandlerUnload.call(prevHandler.router, handlerUnloadEvent);
                }

                if ( !__handlerAbort ) {
                    this.trigger('handler:before-unload', handlerUnloadEvent);
                }
            }

            if (handler && !__handlerAbort) {
                var router = handler.router;
                params = QueryParams.combineParams(params, router.extractNamedParams.call(router, handler.route, path, handler.paramNames));
                var event = {
                    handler: handler,
                    path: path,
                    params: params,
                    abort: handlerAbort,
                    context: this.context
                };
                if (handler.router.beforeHandler) {
                    handler.router.beforeHandler.call(handler.router, event);
                }

                if ( !__handlerAbort ) {
                    this.trigger('handler:before', event);
                }

                if ( !__handlerAbort ) {
                    handler.callback.call(router, params, handler.opts, this.context);
                    this.trigger('handler:after', {
                        handler: handler,
                        path: path,
                        params: params
                    });
                }
            }
            return handler;
        },

        trigger: function (eventName, args) {
            return this.dispatcher.dispatch(Utils.extend({
                source: "Marbles.History",
                name: eventName
            }, args));
        }

    });

    History.regex = {
        routeStripper: /^[\/]/,
        routeParts: /^([^?]*)(?:\?(.*))?$/ // 1: path, 2: params
    };

    if (true) {
        __m__["marbles/history"].pathWithParams = pathWithParams;
    }

    __m__["marbles/history"].default = History;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/router"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;

    /*
     * * * * * * * * * * * * * * * * * *
     * Inspired by Backbone.js Router  *
     * * * * * * * * * * * * * * * * * *
     */

    /**
     * @memberof Marbles
     * @class
     * @see Marbles.History
     * @example
     *	import Router from "marbles/router";
     *	import History from "marbles/history";
     *	var MyRouter = Router.createClass({
     *		displayName: "MyRouter",
     *
     *		// routes are evaluated in the order they are defined
     *		routes: [
     *			{ path: "posts", handler: "posts" },
     *
     *			// :id will be available in the params
     *			{ path: "posts/:id", handler: "posts" },
     *
     *			// * will be available in the params as `splat`
     *			{ path: "posts/:id/*", handler: "posts" },
     *		],
     *
     *		beforeHandler: function (event) { // optional before hook
     *			// same as handler:before event sent through dispatcher
     *			// but only called for the router the handler belongs to
     *			// and called before event is sent through dispatcher
     *		},
     *
     *		posts: function (params, opts) {
     *			// params is an array of objects,
     *			// params[0] should be all you need unless
     *			// you have multiple params of the same name
     *
     *			// opts contains any extra properties given in a route object
     *		}
     *	});
     *	var history = new History();
     *	history.register(new MyRouter()); // register router
     *	history.start(); // bring it to life
     */
    var Router = Utils.createClass({
        displayName: 'Marbles.Router',

        willInitialize: function (options) {
            options = options || {};
            this.context = options.context;
            this.compileRoutes();
        },

        // register route handler
        // handler will be called with an array
        // of param objects, the first of which
        // will contain any named params
        route: function (route, handler, opts) {
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

            this.routes.push({
                route: route,
                name: name,
                handler: handler,
                paramNames: paramNames,
                opts: opts
            });
        },

        compileRoutes: function () {
            this.routes = [];
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
        var ctor =  Utils.createClass(proto);
        ctor.routes = routes;
        ctor.createClass = Router.createClass.bind(ctor);
        return ctor;
    };

    __m__["marbles/router"].default = Router;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/accessors"] = {};
    /* @flow weak */

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

    /**
     * @deprecated
     * @memberof Marbles
     * @mixin
     */
    var Accessors = {
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

    __m__["marbles/accessors"].default = Accessors;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/transaction"] = {};
    /* @flow weak */

    var Transaction = {
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

    __m__["marbles/transaction"].default = Transaction;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/dirty_tracking"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;

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
        var __hasChanges = Utils.extend({}, this.__hasChanges);
        if (assertEqual(this.__originalValues[keypath], value)) {
            __hasChanges[keypath] = false;
        } else {
            __hasChanges[keypath] = true;
        }
        this.set("__hasChanges", __hasChanges);
    };

    var DirtyTracking = {
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

    __m__["marbles/dirty_tracking"].default = DirtyTracking;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/validation"] = {};
    /* @flow weak */

    var escapeKeypath = function (keypath) {
        return keypath.replace(".", "_");
    };

    var Validation = {
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

    __m__["marbles/validation"].default = Validation;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/uri"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;
    var QueryParams = __m__["marbles/query_params"].QueryParams || __m__["marbles/query_params"].default;

    var URI = Utils.createClass({
        displayName: 'Marbles.URI',

        mixins: [QueryParams],

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

    // $1 = scheme, $2 = hostname, $3 = port, $4 = path, $5 = query, $6 = hash
    URI.REGEX = /^(https?:\/\/)?([^\/]+(:\d+)?)?([^\?#]+)?(\?[^#]+)?(#.+)?$/;

    __m__["marbles/uri"].default = URI;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/http"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;
    var Events = __m__["marbles/events"].Events || __m__["marbles/events"].default;
    var URI = __m__["marbles/uri"].URI || __m__["marbles/uri"].default;

    /**
     * @memberof Marbles
     * @class
     * @name Marbles.HTTPRequest
     * @params {Object} options
     * @see Marbles.HTTP
     */
    var Request = Utils.createClass({
        displayName: 'Marbles.HTTPRequest',

        mixins: [Events],

        willInitialize: function (options) {
            if (!options) {
                options = {};
            }

            this.middleware = options.middleware || [];

            this.method = options.method || 'GET';
            this.method = this.method.toUpperCase();

            this.uri = new URI(options.url, options.params || [{}]);

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

            this.on('before:send', function () {
                var completeResolve, completeReject;
                this.completePromise = new Promise(function (rs, rj) {
                    completeResolve = rs;
                    completeReject = rj;
                });
                var onComplete = function (res, xhr) {
                    this.off('terminated', onTerminated, this);
                    this.completePromise = null;
                    completeResolve([res, xhr]);
                };
                var onTerminated = function (err) {
                    this.off('complete', onComplete, this);
                    this.completePromise = null;
                    completeReject(err);
                };
                this.once('complete', onComplete, this);
                this.once('terminated', onTerminated, this);
            }, this);
            this.completePromise = null;
        },

        then: function () {
            var promise = this.completePromise || new Promise(function (resolve, reject) {
                reject(new Error("Request not started!"));
            });
            return promise.then.apply(promise, arguments);
        },

        catch: function () {
            var promise = this.completePromise || new Promise(function (resolve, reject) {
                reject(new Error("Request not started!"));
            });
            return promise.catch.apply(promise, arguments);
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

            this.trigger('before:send');
            try {
                this.xhr.send(this.requestBody);
            } catch (e) {
                setTimeout(function () {
                    throw e;
                }, 0);
            }
            this.trigger('after:send');
        }
    });

    Request.activeRequests = {};

    /**
     * @memberof Marbles
     * @func
     * @params {Object} options
     * @returns {Marbles.HTTPRequest} request
     * @see Marbles.HTTP.Middleware
     * @example
     *	Marbles.HTTP({
     *		method: "POST",
     *		url: "http://example.com/posts",
     *		params: [{
     *			a: 1
     *		}],
     *		body: { title: "My Post", content: "Lorem ipsum..." },
     *		middleware: [
     *			Marbles.HTTP.Middleware.SerializeJSON
     *		],
     *		headers: {
     *			"Content-Type": "application/json",
     *		}
     *	}).then(function (args) {
     *		var res = args[0];
     *		var xhr = args[1];
     *		// request complete
     *		// do something
     *	}).catch(function (err) {
     *		// request terminated
     *		// do something
     *	});
     */
    var HTTP = function (options) {
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

    if (true) {
        __m__["marbles/http"].Request = Request;
        __m__["marbles/http"].HTTP = HTTP;
    }

    __m__["marbles/http"].default = HTTP;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */
/**
 * @memberof Marbles.HTTP.Middleware
 * @param {String} user
 * @param {String} password
 * @desc Returns middleware for setting `Authorize` header
 */

(function(__m__) {
    "use strict";
    __m__["marbles/http/middleware/basic_auth"] = {};
    /* @flow weak */
    /**
     * @memberof Marbles.HTTP.Middleware
     * @param {String} user
     * @param {String} password
     * @desc Returns middleware for setting `Authorize` header
     */

    var BasicAuth = function (user, password) {
        var authHeader = "Basic "+ window.btoa((user || "") +":"+ (password || ""));
        return {
            willSendRequest: function (request) {
                try {
                    request.setRequestHeader("Authorization", authHeader);
                } catch (e) {
                    setTimeout(function () {
                        throw e;
                    }, 0);
                }
            }
        };
    };

    __m__["marbles/http/middleware/basic_auth"].default = BasicAuth;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/http/middleware/form_encoded"] = {};
    var QueryParams = __m__["marbles/query_params"].QueryParams || __m__["marbles/query_params"].default;

    var CONTENT_TYPE = 'application/x-www-form-urlencoded';

    /**
     * @memberof Marbles.HTTP.Middleware
     * @desc Serializes the request body if the Content-Type header matches. Deserializes the response body if the Content-Type header matches.
     */
    var FormEncoded = {
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
            request.requestBody = QueryParams.serializeParams(params).substring(1);
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

            request.responseData = QueryParams.deserializeParams(responseData);
        }
    };

    if (true) {
        __m__["marbles/http/middleware/form_encoded"].CONTENT_TYPE = CONTENT_TYPE;
    }

    __m__["marbles/http/middleware/form_encoded"].default = FormEncoded;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */
/**
 * @memberof Marbles.HTTP.Middleware
 * @desc Serializes the request body if the Content-Type header matches. Deserializes the response body if the Content-Type header matches.
 */

(function(__m__) {
    "use strict";
    __m__["marbles/http/middleware/serialize_json"] = {};
    /* @flow weak */
    /**
     * @memberof Marbles.HTTP.Middleware
     * @desc Serializes the request body if the Content-Type header matches. Deserializes the response body if the Content-Type header matches.
     */

    var SerializeJSON = {
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

    __m__["marbles/http/middleware/serialize_json"].default = SerializeJSON;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */
/**
 * @memberof Marbles.HTTP.Middleware
 * @desc Sets `withCredentials = true` on the XMLHttpRequest object
 */

(function(__m__) {
    "use strict";
    __m__["marbles/http/middleware/with_credentials"] = {};
    /* @flow weak */
    /**
     * @memberof Marbles.HTTP.Middleware
     * @desc Sets `withCredentials = true` on the XMLHttpRequest object
     */

    var WithCredentials = {
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

    __m__["marbles/http/middleware/with_credentials"].default = WithCredentials;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
 "use strict";
 __m__["marbles/http/middleware"] = {};
 var BasicAuth = __m__["marbles/http/middleware/basic_auth"].BasicAuth || __m__["marbles/http/middleware/basic_auth"].default;
 var FormEncoded = __m__["marbles/http/middleware/form_encoded"].FormEncoded || __m__["marbles/http/middleware/form_encoded"].default;
 var SerializeJSON = __m__["marbles/http/middleware/serialize_json"].SerializeJSON || __m__["marbles/http/middleware/serialize_json"].default;
 var WithCredentials = __m__["marbles/http/middleware/with_credentials"].WithCredentials || __m__["marbles/http/middleware/with_credentials"].default;

 /**
  * @memberof Marbles
  * @namespace HTTP.Middleware
  * @see Marbles.HTTP
  *
  * @example
  *	var MyMiddleware = {
  *		willSendRequest: function (request) {
  *			// do something
  *		},
  *
  *		didReceiveResponse: function (request) {
  *			// do something
  *		}
  *	};
  */

 var Middleware = {
     BasicAuth: BasicAuth,
     FormEncoded: FormEncoded,
     SerializeJSON: SerializeJSON,
     WithCredentials: WithCredentials
 };

 __m__["marbles/http/middleware"].default = Middleware;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/http/link_header"] = {};
    /* @flow weak */

    var LINK_SPLITTER = /,[\s\r\n]*/;
    var LINK_MATCHER = /<([^>]+)>((?:[\s\r\n]|.)*)/;
    var ATTR_SPLITTER = /[\s\r\n]*;[\s\r\n]*/;
    var ATTR_MATCHER = /([^=]+)=['"]?([^'"]+)['"]?/;

    /**
     * @memberof Marbles.HTTP
     * @mixin
     */
    var LinkHeader = {
        /**
         * @memberof Marbles.HTTP.LinkHeader
         * @method
         * @param {String} linkHeader String returned from `xhr.getResponseHeader("Link")`
         * @returns {Array} Array of objects representing each link
         * @example
         *	Marbles.HTTP.LinkHeader.parse('<?page=2>; rel="next", <?page=1>; rel="prev"');
         *	//=> [{"href":"?page=2","rel":"next"},{"href":"?page=1","rel":"prev"}]
         */
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

    __m__["marbles/http/link_header"].default = LinkHeader;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/object"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;
    var Accessors = __m__["marbles/accessors"].Accessors || __m__["marbles/accessors"].default;
    var Events = __m__["marbles/events"].Events || __m__["marbles/events"].default;

    /**
     * @deprecated
     * @see Marbles.State
     * @see Marbles.Store
     * @name Object
     * @memberof Marbles
     * @class
     */
    var MarblesObject = Utils.createClass({
        displayName: 'Marbles.Object',

        mixins: [Accessors, Events],

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

    __m__["marbles/object"].default = MarblesObject;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/id_counter"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;

    var IDCounter = Utils.createClass({
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

    IDCounter.counterScopeMapping = {};
    IDCounter.counterForScope = function (scope) {
        var counter = this.counterScopeMapping[scope];
        if (!counter) {
            counter = new this(scope);
            this.counterScopeMapping[scope] = counter;
        }
        return counter;
    };

    __m__["marbles/id_counter"].default = IDCounter;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/id_mapping"] = {};
    var IDCounter = __m__["marbles/id_counter"].IDCounter || __m__["marbles/id_counter"].default;

    var __generateCIDName,
            __buildCIDMappingScope,
            __trackInstance,
            __updateCIDMapping;

    var CIDMapping = {

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
            ctor.__cidCounter = new IDCounter(ctor.__cidName);
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

    __m__["marbles/id_mapping"].default = CIDMapping;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/model"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;
    var Transaction = __m__["marbles/transaction"].Transaction || __m__["marbles/transaction"].default;
    var CIDMapping = __m__["marbles/id_mapping"].CIDMapping || __m__["marbles/id_mapping"].default;
    var Accessors = __m__["marbles/accessors"].Accessors || __m__["marbles/accessors"].default;
    var Events = __m__["marbles/events"].Events || __m__["marbles/events"].default;

    /**
     * @deprecated Use the Store instead
     * @see Marbles.Store
     * @memberof Marbles
     * @class
     */
    var Model = Utils.createClass({
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
                ctor: Events,
                proto: Events
            },

            // Extend ptoto with accessor methods
            Accessors,

            // Extend proto with transaction method
            Transaction,

            // CIDMapping extends both ctor and proto
            CIDMapping
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

    __m__["marbles/model"].default = Model;
})(window.____modules____ = window.____modules____ || {});
/* @flow weak */

(function(__m__) {
    "use strict";
    __m__["marbles/collection"] = {};
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;
    var Model = __m__["marbles/model"].Model || __m__["marbles/model"].default;
    var Accessors = __m__["marbles/accessors"].Accessors || __m__["marbles/accessors"].default;
    var Events = __m__["marbles/events"].Events || __m__["marbles/events"].default;
    var CIDMapping = __m__["marbles/id_mapping"].CIDMapping || __m__["marbles/id_mapping"].default;

    /**
     * @deprecated Use the Store instead
     * @see Marbles.Store
     * @memberof Marbles
     * @class
     */
    var Collection = Utils.createClass({
        displayName: 'Marbles.Collection',

        mixins: [
            // Add some properties to ctor
            {
                ctor: {
                    collectionName: 'collection',
                    cidScope: ['collectionName'],
                    model: Model,

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
                ctor: Events,
                proto: Events
            },

            // Extend ptoto with accessor methods
            Accessors,

            // CIDMapping extends both ctor and proto
            CIDMapping
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

    __m__["marbles/collection"].default = Collection;
})(window.____modules____ = window.____modules____ || {});
(function(__m__) {
    "use strict";
    __m__["marbles"] = {};
    var VERSION = __m__["marbles/version"].VERSION || __m__["marbles/version"].default;
    var Utils = __m__["marbles/utils"].Utils || __m__["marbles/utils"].default;
    var Dispatcher = __m__["marbles/dispatcher"].Dispatcher || __m__["marbles/dispatcher"].default;
    var State = __m__["marbles/state"].State || __m__["marbles/state"].default;
    var Store = __m__["marbles/store"].Store || __m__["marbles/store"].default;
    var Events = __m__["marbles/events"].Events || __m__["marbles/events"].default;
    var History = __m__["marbles/history"].History || __m__["marbles/history"].default;
    var Router = __m__["marbles/router"].Router || __m__["marbles/router"].default;
    var Accessors = __m__["marbles/accessors"].Accessors || __m__["marbles/accessors"].default;
    var Transaction = __m__["marbles/transaction"].Transaction || __m__["marbles/transaction"].default;
    var DirtyTracking = __m__["marbles/dirty_tracking"].DirtyTracking || __m__["marbles/dirty_tracking"].default;
    var Validation = __m__["marbles/validation"].Validation || __m__["marbles/validation"].default;
    var HTTPRequest = __m__["marbles/http"].HTTPRequest || __m__["marbles/http"].default, HTTP = __m__["marbles/http"].HTTP || __m__["marbles/http"].default;
    var HTTPMiddleware = __m__["marbles/http/middleware"].HTTPMiddleware || __m__["marbles/http/middleware"].default;
    var HTTPLinkHeader = __m__["marbles/http/link_header"].HTTPLinkHeader || __m__["marbles/http/link_header"].default;
    var MarblesObject = __m__["marbles/object"].MarblesObject || __m__["marbles/object"].default;
    var Model = __m__["marbles/model"].Model || __m__["marbles/model"].default;
    var Collection = __m__["marbles/collection"].Collection || __m__["marbles/collection"].default;

    if (true) {
        __m__["marbles"].Utils = Utils;
        __m__["marbles"].Dispatcher = Dispatcher;
        __m__["marbles"].State = State;
        __m__["marbles"].Store = Store;
        __m__["marbles"].Events = Events;
        __m__["marbles"].History = History;
        __m__["marbles"].Router = Router;
        __m__["marbles"].Accessors = Accessors;
        __m__["marbles"].Transaction = Transaction;
        __m__["marbles"].DirtyTracking = DirtyTracking;
        __m__["marbles"].Validation = Validation;
        __m__["marbles"].HTTP = HTTP;
        __m__["marbles"].HTTPRequest = HTTPRequest;
        __m__["marbles"].HTTPMiddleware = HTTPMiddleware;
        __m__["marbles"].HTTPLinkHeader = HTTPLinkHeader;
        __m__["marbles"].Object = MarblesObject;
        __m__["marbles"].Model = Model;
        __m__["marbles"].Collection = Collection;
    }

    var Marbles = {
        VERSION: VERSION,
        Utils: Utils,
        Dispatcher: Dispatcher,
        State: State,
        Store: Store,
        Events: Events,
        History: History,
        Router: Router,
        Accessors: Accessors,
        Transaction: Transaction,
        DirtyTracking: DirtyTracking,
        Validation: Validation,
        HTTP: HTTP,
        HTTPRequest: HTTPRequest,
        Object: MarblesObject,
        Model: Model,
        Collection: Collection
    };
    Marbles.HTTP.Middleware = HTTPMiddleware;
    Marbles.HTTP.LinkHeader = HTTPLinkHeader;
    __m__["marbles"].default = Marbles;
})(window.____modules____ = window.____modules____ || {});
