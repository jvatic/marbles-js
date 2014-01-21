//= require ./core
//= require_self

(function () {
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
			var keys = parseKeypath(keypath);
			var lastKey = keys.pop();
			var ref = this;
			for (var k in keys) {
				ref[k] = ref[k] || {};
				ref = ref[k];
			}

			var oldValue = ref[lastKey];
			ref[lastKey] = value;
			if (value !== oldValue && typeof this.trigger === 'function') {
				this.trigger('change', value, oldValue, keypath, options);
				this.trigger('change:'+ keypath, value, oldValue, keypath, options);
			}
		},

		get: function (keypath, options) {
			var keys = parseKeypath(keypath);
			var lastKey = keys.pop();
			var ref = this;
			for (var k in keys) {
				if (!ref || !ref.hasOwnProperty(k)) {
					break;
				}
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
			var keys = parseKeypath(keypath);
			var lastKey = keys.pop();

			var ref = this;
			if (keys.length) {
				ref = this.get(keys.join(KEYPATH_SEP));
			}

			if (!ref) {
				throw Error(displayName +"("+ this.constructor.displayName +"): Can't remove property "+ JSON.stringify(lastKey) +" from undefined keypath: "+ keys.join(KEYPATH_SEP));
			}

			var oldValue = ref[lastKey];
			delete ref[lastKey];

			if (oldValue !== undefined && typeof this.trigger === 'function') {
				this.trigger('change', undefined, oldValue, keypath, options);
				this.trigger('change'+ keypath, undefined, oldValue, keypath, options);
			}
		},

		hasKey: function (keypath, options) {
			var keys = parseKeypath(keypath);
			var lastKey = keys.pop();
			var ref = this.get(keys.join(KEYPATH_SEP));
			if (!ref || !ref.hasOwnProperty(lastKey)) {
				return false;
			}
			return true;
		}
	};

})();
