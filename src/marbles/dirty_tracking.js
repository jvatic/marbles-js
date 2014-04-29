//= require ./core
//= require_self

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
			keypaths.forEach(function (__keypath) {
				// changes via root object
				var __baseKeypath = __keypath.split('.')[0];
				var __endKeypath = __keypath.split('.')[1];
				this.on("change:"+ __baseKeypath, function (value) {
					var __value;
					if (value) {
						__value = value[__endKeypath];
					}
					calculateDiff.call(this, __keypath, __value);
				}.bind(this));

				// changes via child objects
				this.on("change", function (value, oldValue, keypath) {
					var __value, k;
					if (keypath !== __keypath && keypath.substr(0, __keypath.length) === __keypath) {
						k = keypath.substring(__keypath.length+1);
						__value = this.get(__keypath);
						calculateDiff.call(this, __keypath, __value);
					}
				}.bind(this));

				this.on("change:"+ __keypath, function (value) {
					calculateDiff.call(this, __keypath, value);
				}.bind(this));
			}.bind(this));
		},

		didInitialize: function () {
			this.resetDirtyTracking();
		},

		proto: {
			resetDirtyTracking: function () {
				var keypaths = this.constructor.dirtyTrackingKeypaths;
				this.__originalValues = {};
				this.__hasChanges = {};
				keypaths.forEach(function (keypath) {
					this.__originalValues[keypath] = this.get(keypath);
					this.__hasChanges[keypath] = false;
				}.bind(this));
			},

			isDirty: function () {
				for (var k in this.__hasChanges) {
					if (this.__hasChanges.hasOwnProperty(k)) {
						if (this.__hasChanges[k] === true) {
							return true;
						}
					}
				}
				return false;
			}
		}
	};

})();
