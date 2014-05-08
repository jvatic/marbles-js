//= require ./core
//= require ./utils
//= require ./id_counter
//= require_self

(function () {

	"use strict";

	var __generateCIDName,
			__buildCIDMappingScope,
			__trackInstance,
			__updateCIDMapping;

	Marbles.CIDMapping = {

		didExtendCtor: function (ctor) {
			// instance cid mapping
			// (cid -> instance)
			ctor.instances = {};

			// instance lookup mapping
			// (lookup key -> cid)
			ctor.__cidMapping = {};

			// used to generate instance lookup key
			if (ctor.cidMappingScope === undefined) {
				ctor.cidMappingScope = [];
			}

			// generated from cidScope
			// used for cidCounter
			if (ctor.cidScope) {
				ctor.__cidName = __generateCIDName.call(ctor);
			} else {
				ctor.__cidName = '_default';
			}

			// used to generate instance cid
			ctor.__cidCounter = new Marbles.IDCounter(ctor.__cidName);
		},

		ctor: {
			find: function (params, options) {
				var _cidMappingScope = __buildCIDMappingScope.call(this, params),
						_cidMapping = this.__cidMapping,
						_cidName = this.__cidName,
						_cid, _instance,
						_should_fetch = (!options || options.fetch !== false);

				if (!options) {
					options = {};
				}

				if (params.hasOwnProperty('cid')) {
					_cid = params.cid;
					_should_fetch = false;
				} else {
					if (_cidMappingScope) {
						_cid = (_cidMapping[_cidName] || {})[_cidMappingScope];
					}
				}

				if (_cid !== undefined && _cid !== null) {
					_instance = this.instances[_cid];
					if (_instance) {
						return _instance;
					}
				}

				if (_should_fetch === true) {
					this.fetch(params, options);
				}

				return null;
			},

			findOrNew: function (attrs) {
				var model = this.find(attrs, {fetch:false});
				if ( !model ) {
					model = new this(attrs);
				}
				return model;
			},

			fetch: function () {
				throw new Error("You need to define " + this.displayName + ".fetch(params, options)");
			},

			detach: function (cid) {
				var _instances = this.instances,
						_instance = _instances[cid],
						_cidName = this.__cidName,
						_cidMapping = this.__cidMapping,
						_index, _tmp;

				if (_instance && _instance.willDetach) {
					_instance.willDetach();
				}

				if (_instances.hasOwnProperty(cid)) {
					delete _instances[cid];
				}
				if (_cidMapping.hasOwnProperty(cid)) {
					delete _cidMapping[cid];
				}

				if (_instances[_cidName]) {
					_index = _instances[_cidName].indexOf(cid);
					if (_index !== -1) {
						_tmp = _instances[_cidName];
						_tmp = _tmp.slice(0, _index).concat(
							_tmp.slice(_index + 1, _tmp.length)
						);
						_instances[_cidName] = _tmp;
					}
				}

				if (_instance) {
					_instance.trigger('detach');
					if (_instance.didDetach) {
						_instance.didDetach();
					}
				}
				this.trigger('detach', cid, _instance);

				// clear all event bindings
				this.off();
			}
		},

		proto: {
			initCIDMapping: function () {
				if (this.cid === undefined) {
					this.cid = this.constructor.__cidCounter.nextID();
				}

				__trackInstance.call(this);
			},

			detach: function () {
				this.constructor.detach(this.cid);
			}
		}

	};

	__generateCIDName = function () {
		var _parts = [],
				i,
				_ref = this.cidScope,
				_len;
		for (i = 0, _len = _ref.length; i < _len; i++) {
			_parts.push(this[ _ref[i] ]);
		}
		return _parts.join(':');
	};

	__buildCIDMappingScope = function (attrs) {
		var _scope = [],
				i,
				_ref = this.cidMappingScope,
				_len;
		for (i = 0, _len = _ref.length; i < _len; i++) {
			if ( !attrs.hasOwnProperty(_ref[i]) ) {
				// Can't build a partial scope
				return null;
			} else {
				_scope.push(attrs[ _ref[i] ]);
			}
		}
		return _scope.join(':');
	};

	__trackInstance = function () {
		var _ctor = this.constructor,
				_instances = _ctor.instances,
				_cidMappingScope = _ctor.cidMappingScope,
				i, _len;

		_instances[this.cid] = this;

		for (i = 0, _len = _cidMappingScope.length; i < _len; i++) {
			this.on('change:'+ _cidMappingScope[i], __updateCIDMapping, this);
		}
	};

	__updateCIDMapping = function (new_val, old_val, attr) {
		var _old_scope = [],
				_new_scope = [],
				_ctor = this.constructor,
				_cidMapping = _ctor.__cidMapping,
				_cidName = _ctor.__cidName,
				i, _ref, _len, _val;

		_ref = _ctor.cidMappingScope;
		for (i = 0, _len = _ref.length; i < _len; i++) {
			if (_ref[i] === attr) {
				_old_scope.push(old_val);
				_new_scope.push(new_val);
			} else {
				_val = this.get(_ref[i]);
				_old_scope.push(_val);
				_new_scope.push(_val);
			}
		}

		_old_scope = _old_scope.join(':');
		_new_scope = _new_scope.join(':');

		if (_cidMapping[_cidName] === undefined) {
			_cidMapping[_cidName] = {};
		}
		_cidMapping[_cidName][_new_scope] = this.cid;
		if (_cidMapping[_cidName].hasOwnProperty(_old_scope)) {
			delete _cidMapping[_cidName][_old_scope];
		}
	};

})();
