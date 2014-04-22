//= require ./core
//= require_self

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

			operationFn.call(tmp, tmp);

			if (shouldAbort) {
				return;
			}

			delete tmp.trigger;
			delete tmp.abortTransaction;

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
		},

		abortTransaction: function () {
			throw new Error("Must be inside a transaction to abort one.");
		}
	};

})();
