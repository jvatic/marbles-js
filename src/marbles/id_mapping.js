//= require ./core
//= require ./utils
//= require ./id_counter
//= require_self

(function () {

	var CIDMapping = {},
			CIDMappingProto = {};
	Marbles.CIDMapping = CIDMapping;
	Marbles.CIDMappingProto = CIDMappingProto;
	CIDMapping.initConstructor = function (ctor) {
		ctor.find = CIDMapping.find.bind(ctor);
		ctor.fetch = CIDMapping.fetch.bind(ctor);
		ctor.detach = CIDMapping.detach.bind(ctor);
		ctor.__generateCIDName = CIDMapping.__generateCIDName.bind(ctor);
		ctor.__buildCIDMappingScipe = CIDMapping.__buildCIDMappingScipe.bind(ctor);

		// instance cid mapping
		// (cid -> instance)
		if (!ctor.instances) {
			ctor.instances = {all: {}};
		}
		if (!ctor.instances.all) {
			ctor.instances.all = {};
		}

		// instance lookup mapping
		// (lookup key -> cid)
		if (!ctor.cidMapping) {
			ctor.cidMapping = {};
		}

		// used to generate instance lookup key
		if (!ctor.cidMappingScope) {
			ctor.cidMappingScope = [];
		}

		// used to generate cid
		if (!ctor.cidScope) {
			ctor.cidScope = [];
		}

		// generated from cidScope
		// used for cidCounter
		if (!ctor.cidName) {
			if (ctor.cidScope.length) {
				ctor.cidName = ctor.__generateCIDName();
			} else {
				ctor.cidName = '_default';
			}
		}

		// used to generate instance cid
		if (!ctor.cidCounter) {
			ctor.cidCounter = new Marbles.IDCounter(ctor.cidName);
		}

		Marbles.Utils.extend(ctor.prototype, CIDMappingProto);
	};

	CIDMapping.find = function (params, options) {
		if (!options) {
			options = {};
		}

		var cidMappingScope = this.__buildCIDMappingScipe(params);
		if (cidMappingScope) {
			var cid = (this.cidMapping[this.cidName] || {})[cidMappingScope];
			if (cid) {
				params.cid = cid;
			}
		}

		if (params.cid) {
			var instance = this.instances.all[params.cid];
			if (instance) {
				return instance;
			}
		}

		if (!params.hasOwnProperty('cid') && options.fetch !== false) {
			this.fetch(params, options);
		}

		return null;
	};

	CIDMapping.fetch = function (params, options) {
		throw Error("You need to define " + (this.displayName || this.name) + ".fetch(params, options)");
	};

	CIDMapping.detach = function (cid) {
		var instance = this.instances.all[cid];
		delete this.instances.all[cid];

		if (this.instances[this.cidName]) {
			var index = this.instances[this.cidName].indexOf(cid);
			if (index !== -1) {
				instances = this.instances[this.cidName];
				instances = instances.slice(0, index).concat(
					instances.slice(index + 1, instances.length)
				);
				this.instances[this.cidName] = instances;
			}
		}

		var _ref = this.cidMapping[this.cidName];
		for (var k in _ref) {
			var _cid = _ref[k];
			if (_cid === cid) {
				delete _ref[k];
				break;
			}
		}

		var cidMappingScope = this.__buildCIDMappingScipe(instance);
		delete (this.cidMapping[this.cidName] || {})[cidMappingScope];

		this.trigger('detach', cid, instance);
	};

	CIDMapping.__generateCIDName = function () {
		var parts = [];
		for (var i = 0, _ref = this.cidScope, _len = _ref.length; i < _len; i++) {
			parts.push(this[_ref[i]]);
		}
		return parts.join(':');
	};

	CIDMapping.__buildCIDMappingScipe = function (params) {
		var scope = [];
		for (var i = 0, _ref = this.cidMappingScope, _len = _ref.length; i < _len; i++) {
			if (!params.hasOwnProperty(_ref[i])) {
				return null;
			} else {
				scope.push(params[_ref[i]]);
			}
		}
		return scope.join(':');
	};

	CIDMappingProto = {
		initCIDMapping: function () {
			CIDMapping.initConstructor(this.constructor);

			// generate cid if it's not already defined
			if (!this.cid) {
				this.cid = this.constructor.cidCounter.nextID();
			}

			// add instance to cid and lookup mappings
			this.__trackInstance();
		},

		detach: function () {
			this.constructor.detach(this.cid);
			this.trigger('detach', this);
		},

		__trackInstance: function () {
			var ctor = this.constructor;
			ctor.instances.all[this.cid] = this;
			if (!ctor.instances[ctor.cidName]) {
				ctor.instances[ctor.cidName] = [];
			}
			ctor.instances[ctor.cidName].push(this.cid);

			for (var i = 0, _ref = ctor.cidMappingScope, _len = _ref.length; i < _len; i++) {
				this.on('change:' + _ref[i], this.__updateCIDMapping, this);
			}
		},

		__updateCIDMapping: function (newValue, oldValue, attr) {
			var oldScope = [],
					newScope = [],
					ctor = this.constructor;

			var key, val;
			for (var i = 0, _ref = ctor.cidMappingScope, _len = _ref.length; i < _len; i++) {
				key = _ref[i];
				if (key === attr) {
					oldScope.push(oldValue);
					newScope.push(newValue);
				} else {
					val = this.get(key);
					oldScope.push(val);
					newScope.push(val);
				}
			}
			oldScope = oldScope.join(':');
			newScope = newScope.join(':');

			if (!ctor.cidMapping[ctor.cidName]) {
				ctor.cidMapping[ctor.cidName] = {};
			}
			ctor.cidMapping[ctor.cidName][newScope] = this.cid;
			delete ctor.cidMapping[ctor.cidName][oldScope];
		}
	};

})();
