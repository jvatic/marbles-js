//= require ./core

(function () {

	var __hasProp = {}.hasOwnProperty;

	Marbles.Utils = {
		// @function (child, parent)
		// The prototype of child is made to inherit from parent.
		// Returns child.
		// A `__super__` property is added to child
		// for access to the parent prototype.
		inheritPrototype: function(child, parent) {
			for (var key in parent) {
				if (__hasProp.call(parent, key)) child[key] = parent[key];
			}

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
			var ctor;
			if (proto.hasOwnProperty('parentClass')) {
				var parent = proto.parentClass;
				delete proto.parentClass;

				ctor = function () {
					// Handle any initialization before
					// we call the parent constructor
					if (typeof this.willInitialize === 'function') {
						this.willInitialize.apply(this, arguments);
					}

					// Call the parent constructor
					ctor.__super__.constructor.apply(this, arguments);

					// Handle any initialization after
					// we call the parent constructor
					if (typeof this.didInitialize === 'function') {
						this.didInitialize.apply(this, arguments);
					}

					return this;
				}

				Marbles.Utils.inheritPrototype(ctor, parent);
			} else {
				ctor = function () {
					// Call initialization functions
					if (typeof this.willInitialize === 'function') {
						this.willInitialize.apply(this, arguments);
					}
					if (typeof this.didInitialize === 'function') {
						this.didInitialize.apply(this, arguments);
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
			for (var i = 0, _len = mixins.length; i < _len; i++) {
				var mixin = mixins[i];
				for (var k in mixin) {
					if (!mixin.hasOwnProperty(k)) {
						continue;
					}
					ctor.prototype[k] = mixin[k];
				}
			}

			return ctor;
		}
	};

})();
