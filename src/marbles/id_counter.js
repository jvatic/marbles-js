//= require ./core
//= require_self

(function () {

	var IDCounter = Marbles.Utils.createClass({
		displayName: 'Marbles.IDCounter',

		willInitialize: function (scope, initialCount) {
			if (!initialCount) {
				initialCount = 0;
			}

			this.scope = scope;
			this.count = initialCount;
		},

		incrementCounter: function () {
			return this.count++;
		},

		nextID: function () {
			return this.scope + '_' + this.incrementCounter();
		}

	});

	Marbles.IDCounter = IDCounter;

	IDCounter.counterScopeMapping = {};
	IDCounter.counterForScope = function (scope) {
		var counter = this.counterScopeMapping[scope];
		if (!counter) {
			counter = new this(scope);
			this.counterScopeMapping[scope] = counter;
		}
		return counter;
	};

})();
