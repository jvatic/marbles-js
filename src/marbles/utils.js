//= require ./core

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


	/**
	 * @memberof Marbles
	 * @namespace Utils
	 */
	Marbles.Utils = {
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
			Marbles.Utils.extend(child, parent);

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
		 *	Marbles.Utils.createClass({
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
