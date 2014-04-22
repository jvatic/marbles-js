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

			operationFn.call(tmp, tmp);

			delete tmp.trigger;

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
		}
	};

})();
