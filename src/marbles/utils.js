//= require ./core

(function () {

	var __hasProp = {}.hasOwnProperty;

	var __extend = function (obj, others, options) {
		var override = options.override;

		for (var i = 0, _len = others.length; i < _len; i++) {
			var other = others[i];

			for (var key in other) {
				if (override === false && __hasProp.call(obj, key)) {
					continue;
				}

				if (__hasProp.call(other, key)) {
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

			function ctor() {
				this.constructor = child;
			}
			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		},

		// @function (proto)
		// returns constructor function
		createClass: function (proto) {
			var ctor,
					willInitialize = proto.willInitialize,
					didInitialize = proto.didInitialize;

			delete proto.willInitialize;
			delete proto.didInitialize;

			if (proto.hasOwnProperty('parentClass')) {
				var parent = proto.parentClass;
				delete proto.parentClass;

				ctor = function () {
					// Handle any initialization before
					// we call the parent constructor
					if (typeof willInitialize === 'function') {
						var res = willInitialize.apply(this, arguments);
						if (res) {
							return res;
						}
					}

					// Call the parent constructor
					ctor.__super__.constructor.apply(this, arguments);

					// Handle any initialization after
					// we call the parent constructor
					if (typeof didInitialize === 'function') {
						didInitialize.apply(this, arguments);
					}

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

			// Add all remaining properties
			// on proto to the prototype
			for (var k in proto) {
				if (!proto.hasOwnProperty(k)) {
					continue;
				}
				ctor.prototype[k] = proto[k];
			}

			// Extend the prototype with any given mixins
			Marbles.Utils.extend.apply(null, [].concat([ctor.prototype]).concat(mixins));

			return ctor;
		}
	};

})();
