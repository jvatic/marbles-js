/* @flow weak */
import Utils from "./utils";

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

export default DirtyTracking;
