//= require ./core
//= require ./id_counter
//= require ./accessors
//= require ./events
//= require_self

(function () {

	// @class Model
	function Model (attrs, options) {
		if (!this.constructor._id_counter) {
			this.constructor._id_counter = Marbles.IDCounter.counterForScope(this.constructor.model_name);
		}

		if (!attrs) {
			attrs = {};
		}

		if (!options) {
			options = {};
		}
		this.options = options;

		this.fields = [];

		this.generateCid();
		this.trackInstance();

		for (var _ref = this.constructor.id_mapping_scope, i = 0, _len = _ref.length; i < _len; i++) {
			this.on('change:' + _ref[i], this.updateIdMapping, this);
		}

		this.parseAttributes(attrs);

		if (this.constructor.dirty_tracking_enabled) {
			this.dirty_tracking = new Marbles.Object();
			this.on('change', this.keypathChanged, this);
		}

		return this;
	}

	Marbles.Model = Model;

	_.extend(Model, Marbles.Events);
	_.extend(Model.prototype, Marbles.Events);

	Model.instances = { all: {} };
	Model.model_name = '_default';
	Model.id_mapping = {};
	Model.id_mapping_scope = ['id'];
	Model.dirty_tracking_enabled = false;

	Model.buildIdMappingScope = function (params) {
		var scope = [];
		for (var i = 0, _ref = this.id_mapping_scope, _len = _ref.length; i < _len; i++) {
			if (!params.hasOwnProperty(_ref[i])) {
				return null;
			} else {
				scope.push(params[_ref[i]]);
			}
		}
		return scope.join(':');
	};

	Model.find = function (params, options) {
		if (!options) {
			options = {};
		}

		var id_scope = this.buildIdMappingScope(params);
		if (id_scope) {
			var cid = (this.id_mapping[this.model_name] || {})[id_scope];
			if (cid) {
				params.cid = cid;
			}
		}

		if (params.cid) {
			var instance = this.instances.all[params.cid];
			if (instance) {
				if (!instance.options.partial_data || options.include_partial_data) {
					if (typeof options.success === 'function') {
						options.success(instance);
					}
					return instance;
				}
			}
		}

		if (!params.hasOwnProperty('cid') && options.fetch !== false) {
			this.fetch(params, options);
		}

		return null;
	};

	Model.fetch = function (params, options) {
		throw Error("You need to define " + (this.name || this.displayName) + ".fetch(params, options)");
	};

	Model.detach = function (cid) {
		var instance = this.instances.all[cid];
		delete this.instances.all[cid];

		if (this.instances[this.model_name]) {
			var index = this.instances[this.model_name].indexOf(cid);
			if (index !== -1) {
				instances = this.instances[this.model_name];
				instances = instances.slice(0, index).concat(
					instances.slice(index + 1, instances.length)
				);
				this.instances[this.model_name] = instances;
			}
		}

		var _ref = this.id_mapping[this.model_name];
		for (var k in _ref) {
			var _cid = _ref[k];
			if (_cid === cid) {
				delete _ref[k];
				break;
			}
		}

		if (this !== Model) {
			this.trigger('detach', cid, instance);
		}
		Model.trigger('detach', cid, instance);
	};

	Model.prototype.detach = function () {
		this.constructor.detach(this.cid);
		this.trigger('detach', this);
	};

	Model.prototype.generateCid = function () {
		if (this.options.cid) {
			this.cid = this.options.cid;
		} else {
			this.cid = this.constructor._id_counter.nextID();
		}
	};

	Model.prototype.trackInstance = function () {
		var c = this.constructor;
		c.instances.all[this.cid] = this;
		if (!c.instances[c.model_name]) {
			c.instances[c.model_name] = [];
		}
		c.instances[c.model_name].push(this.cid);
	};

	Model.prototype.updateIdMapping = function (new_value, old_value, attr) {
		var old_scope = [],
				new_scope = [],
				c = this.constructor;

		for (var _ref = c.id_mapping_scope, i = 0, _len = _ref.length; i < _len; i++) {
			var key = _ref[i];
			if (key === attr) {
				old_scope.push(old_value);
				new_scope.push(new_value);
			} else {
				old_scope.push(this.get(key));
				new_scope.push(this.get(key));
			}
		}
		old_scope = old_scope.join(':');
		new_scope = new_scope.join(':');

		if (!c.id_mapping[c.model_name]) {
			c.id_mapping[c.model_name] = {};
		}
		delete c.id_mapping[c.model_name][old_scope];
		c.id_mapping[c.model_name][new_scope] = this.cid;
	};

	Model.prototype.parseAttributes = function (attrs) {
		for (var k in attrs) {
			this.set(k, attrs[k], {keypath:false, dirty:false});
		}
	};

	Model.prototype.set = function (keypath, val, options) {
		if (!keypath || !keypath.length) {
			return;
		}

		if (!options) {
			options = {};
		}

		var keys;
		if (!options.hasOwnProperty('keypath') || options.keypath) {
			keys = keypath.split('.');
		} else {
			keys = [keypath];
		}

		if (this.fields.indexOf(keys[0]) == -1) {
			this.fields.push(keys[0]);
		}

		Marbles.Accessors.set.apply(this, arguments);
	};

	Model.prototype.get = Marbles.Accessors.get;

	Model.prototype.hasKey = Marbles.Accessors.hasKey;

	Model.prototype.remove = Marbles.Accessors.remove;

	Model.prototype.keypathChanged = function (new_val, old_val, keypath, options) {
		if (options.dirty === false) {
			return;
		}

		if (this.dirty_tracking && !this.dirty_tracking.hasKey(keypath)) {
			this.dirty_tracking.set(keypath, old_val);
		}
	};

	Model.prototype.isDirty = function (keypath, options) {
		if (!this.dirty_tracking) {
			return;
		}
		return this.dirty_tracking.hasKey(keypath, options);
	};

	Model.prototype.keypathPersisted = function (keypath, options) {
		if (!this.dirty_tracking) {
			return;
		}
		this.dirty_tracking.remove(keypath, options);
	};

	Model.prototype.getOriginal = function (keypath, options) {
		if (this.dirty_tracking) {
			return this.dirty_tracking.get(keypath, options);
		} else {
			return this.get(keypath, options);
		}
	};

	Model.prototype.toJSON = function () {
		var attrs = {};
		for (var i = 0, _ref = this.fields, _len = _ref.length; i < _len; i++) {
			var k = _ref[i];
			attrs[k] = this[k];
		}
		return attrs;
	};

})();
