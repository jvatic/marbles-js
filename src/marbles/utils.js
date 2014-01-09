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

		// @function (displayName, constructor, proto [, parent] [, mixin, ...])
		// Returns a new constructor function which inherits
		// from parent (if given) with the prototype extended with
		// any given mixins.
		// The given displayName is used for the constructor's (non-standard) displayName property.
		// The `__super__` property of the returned constructor
		// provides access to the parent prototype.
		createClass: function (displayName, constructor, proto, parent) {
			var _constructor;
			if (parent) {
				_constructor = function () {
					constructor.apply(this, arguments);
					var _ref = _constructor.__super__.constructor.apply(this, arguments);
					return _ref;
				}

				Marbles.Utils.inheritPrototype(_constructor, parent);

				_constructor.displayName = displayName;
			} else {
				_constructor = constructor;
			}

			for (var k in proto) {
				if (!proto.hasOwnProperty(k)) {
					continue;
				}
				_constructor.prototype[k] = proto[k];
			}

			var mixins = Array.prototype.slice.call(arguments, 3);
			for (var i = 0, _len = mixins.length; i < _len; i++) {
				var mixin = mixins[i];
				for (var k in mixin) {
					if (!mixin.hasOwnProperty(k)) {
						continue;
					}
					_constructor.prototype[k] = mixin[k];
				}
			}

			return _constructor;
		}
	};

})();
