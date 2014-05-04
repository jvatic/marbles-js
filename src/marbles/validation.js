//= require ./core
//= require_self

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
