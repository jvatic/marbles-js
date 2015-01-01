var Transaction = {
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

		tmp.finalizeTransaction = function () {
			if (shouldAbort) {
				return;
			}

			delete tmp.trigger;
			delete tmp.abortTransaction;
			delete tmp.finalizeTransaction;

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
		}.bind(this);

		if (arguments.length > 0) {
			operationFn.call(tmp, tmp);
			tmp.finalizeTransaction();
		} else {
			return tmp;
		}
	},

	abortTransaction: function () {
		throw new Error("Must be inside a transaction to abort one.");
	},

	finalizeTransaction: function () {
		throw new Error("Must be inside a transaction to finalize one.");
	}
};

export default Transaction;
