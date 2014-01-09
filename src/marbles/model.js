//= require ./core
//= require ./utils
//= require ./id_mapping
//= require ./accessors
//= require ./events
//= require_self

(function () {

	// @class Model
	function Model (attrs, options) {
		if (!attrs) {
			attrs = {};
		}

		if (!options) {
			options = {};
		}
		this.options = options;

		this.fields = [];

		if (options.cid) {
			this.cid = options.cid;
		}
		this.initCIDMapping();

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

	Model.displayName = 'Marbles.Model';

	Model.modelName = '_model';
	Model.cidScope = ['modelName'];
	Model.cidMappingScope = ['id'];
	Model.dirty_tracking_enabled = false;

	Marbles.CIDMapping.initConstructor(Model);

	Model.createClass = function (proto) {
		var modelName = this.modelName,
				cidMappingScope = this.cidMappingScope;

		if (!proto.hasOwnProperty('displayName')) {
			proto.displayName = this.displayName;
		}

		if (proto.hasOwnProperty('modelName')) {
			modelName = proto.modelName;
			delete proto.modelName;
		}

		if (proto.hasOwnProperty('cidMappingScope')) {
			cidMappingScope = proto.cidMappingScope;
			delete proto.cidMappingScope;
		}

		proto.parentClass = this;
		var ctor = Marbles.Utils.createClass(proto);
		delete ctor.cidName;
		delete ctor.cidCounter;
		ctor.modelName = modelName;
		ctor.cidMappingScope = cidMappingScope;
		Marbles.CIDMapping.initConstructor(ctor);
		return ctor;
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
