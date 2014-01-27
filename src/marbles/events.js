//= require ./core
//= require_self

(function () {

	var EVENT_SPLITTER = /\s+/;

	function initEvents(obj) {
		if (!obj.__events) {
			obj.__events = {};
		}
	}

	Marbles.Events = {
		on: function (events, callback, context, options) {
			initEvents(this);

			if (!Array.isArray(events)) {
				events = events.split(EVENT_SPLITTER);
			}

			var name;
			for (var i = 0, _len = events.length; i < _len; i++) {
				name = events[i];
				if (!this.__events[name]) {
					this.__events[name] = [];
				}
				this.__events[name].push({
					callback: callback,
					context: context || this,
					options: options || {}
				});
			}

			return this; // chainable
		},

		once: function (events, callback, context, options) {
			if (!Array.isArray(events)) {
				events = events.split(EVENT_SPLITTER);
			}

			var bindEvent = function (name) {
				var __callback = function () {
					this.off(name, __callback, this);
					callback.apply(context, arguments);
				};
				this.on(name, __callback, this, options);
			}.bind(this);

			for (var i = 0, _len = events.length; i < _len; i++) {
				bindEvent(events[i]);
			}

			return this; // chainable
		},

		off: function (events, callback, context) {
			// Allow unbinding all events at once
			if (arguments.length === 0) {
				delete this.__events;
				return this; // chainable
			}

			if (!Array.isArray(events)) {
				events = events.split(EVENT_SPLITTER);
			}

			if (!this.__events) {
				return this; // chainable
			}

			var __filterFn = function (binding) {
				if (context && context !== binding.context) {
					return true;
				}
				if (callback && callback !== binding.callback) {
					return true;
				}
				return false;
			};

			var name, i, _len, bindings;
			for (i = 0, _len = events.length; i < _len; i++) {
				name = events[i];

				if (callback === undefined && context === undefined) {
					delete this.__events[name];
					continue;
				}

				bindings = this.__events[name];
				if (!bindings) {
					continue;
				}

				this.__events[name] = Array.prototype.filter.call(bindings, __filterFn);
			}

			return this; // chainable
		},

		trigger: function (events) {
			var args = Array.prototype.slice.call(arguments, 1);

			if (!Array.isArray(events)) {
				events = events.split(EVENT_SPLITTER);
			}

			if (!this.__events) {
				return this; // chainable
			}

			var name, bindings, binding, i, j, _len, _l;
			for (i = 0, _len = events.length; i < _len; i++) {
				bindings = this.__events[events[i]];
				if (!bindings) {
					continue;
				}
				for (j = 0, _l = bindings.length; j < _l; j++) {
					binding = bindings[j];
					if (binding.options.args === false) {
						binding.callback.call(binding.context);
					} else {
						binding.callback.apply(binding.context, args);
					}
				}
			}

			return this; // chainable
		}
	};

})();
