//= require ./model
//= require ./id_mapping
//= require_self

(function () {

"use strict";

Marbles.Collection = Marbles.Utils.createClass({
	displayName: 'Marbles.Collection',

	mixins: [
		// Add some properties to ctor
		{
			ctor: {
				collectionName: 'collection',
				cidScope: ['collectionName'],
				model: Marbles.Model,

				buildModel: function (attrs, options) {
					var _modelCtor = (options || {}).model || this.model,
							_instance = _modelCtor.find(attrs, {fetch:false});
					if (_instance) {
						_instance.parseAttributes(attrs);
					} else {
						_instance = new _modelCtor(attrs);
					}
					return _instance;
				}
			}
		},

		// Make ctor and proto evented
		{
			ctor: Marbles.Events,
			proto: Marbles.Events
		},

		// Extend ptoto with accessor methods
		Marbles.Accessors,

		// CIDMapping extends both ctor and proto
		Marbles.CIDMapping
	],

	willInitialize: function (options) {
		this.modelCIDs = [];

		this.options = {
			unique: !!options.unique
		};

		if (options.cid) {
			this.cid = options.cid;
		}
		this.initCIDMapping();

		this.watchModelMortality();
	},

	watchModelMortality: function () {
		this.constructor.model.on('detach', function (cid) {
			this.removeCIDs([cid]);
		}, this);
	},

	indexOf: function (model) {
		return this.modelCIDs.indexOf(model.cid);
	},

	first: function () {
		return this.constructor.model.find({cid: this.modelCIDs[0]});
	},

	last: function () {
		return this.constructor.model.find({cid: this.modelCIDs[this.modelCIDs.length-1]});
	},

	forEach: function (callback, thisArg) {
		var _ref = this.modelCIDs,
				model;
		for (var i = 0, _len = _ref.length; i < _len; i++) {
			model = this.constructor.model.find({cid: _ref[i]});
			if (model) {
				callback.call(thisArg || this, model, i);
			}
		}
	},

	models: function () {
		var _ref = this.modelCIDs,
				models = [],
				model;
		for (var i = 0, _len = _ref.length; i < _len; i++) {
			model = this.constructor.model.find({cid: _ref[i]});
			if (model) {
				models.push(model);
			}
		}
		return models;
	},

	resetJSON: function (json, options) {
		if (!options) {
			options = {};
		}
		this.modelCIDs = [];
		var models = this.appendJSON(json, {silent:true});
		if (!options.silent) {
			this.trigger('reset', models);
		}
		return models;
	},

	resetModels: function (models, options) {
		if (!options) {
			options = {};
		}
		this.modelCIDs = [];
		models = this.appendModels(models, {silent:true});
		if (!options.silent) {
			this.trigger('reset', models);
		}
		return models;
	},

	reset: function (options) {
		if (!options) {
			options = {};
		}
		this.modelCIDs = [];
		if (!options.silent) {
			this.trigger('reset', []);
		}
	},

	removeAtIndex: function (cidIndex) {
		var cid = this.modelCIDs[cidIndex];
		this.modelCIDs = this.modelCIDs.slice(0, cidIndex).concat(
			this.modelCIDs.slice(cidIndex + 1, this.modelCIDs.length)
		);
		this.trigger('remove', cid);
		return this.modelCIDs.length;
	},

	removeCIDs: function (cids) {
		var index;
		for (var i = 0, _len = cids.length; i < _len; i++) {
			index = this.modelCIDs.indexOf(cids[i]);
			if (index === -1) {
				continue;
			}
			this.removeAtIndex(index);
		}
		return this.modelCIDs.length;
	},

	remove: function () {
		var models = Array.prototype.slice.call(arguments, 0);
		for (var i = 0, _len = models.length; i < _len; i++) {
			this.removeCIDs([models[i].cid]);
		}
		return this.modelCIDs.length;
	},

	prependJSON: function (json, options) {
		if (!json || !json.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var models = [], model;
		for (var i = json.length-1; i >= 0; i--) {
			model = this.constructor.buildModel(json[i]);
			if (!this.options.unique || this.modelCIDs.indexOf(model.cid) === -1) {
				this.modelCIDs.unshift(model.cid);
				models.unshift(model);
			}
		}

		if (!options.silent) {
			this.trigger('prepend', models);
		}

		return models;
	},

	prependModels: function (models, options) {
		if (!models || !models.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var acceptedModels = [], model;
		for (var i = models.length-1; i >= 0; i--) {
			model = models[i];
			if (!this.options.unique || this.modelCIDs.indexOf(model.cid) === -1) {
				this.modelCIDs.unshift(model.cid);
				acceptedModels.unshift(model);
			}
		}

		if (!options.silent) {
			this.trigger('prepend', acceptedModels);
		}

		return acceptedModels;
	},

	prependCIDs: function (cids, options) {
		if (!cids || !cids.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var acceptedModels = [], cid, model;
		for (var i = cids.length; i >= 0; i--) {
			cid = cids[i];
			if (!this.options.unique || this.modelCIDs.indexOf(cid) === -1) {
				model = this.constructor.find({cid: cid});
				if (!model) {
					continue;
				}
				this.modelCIDs.unshift(cid);
				acceptedModels.unshift(model);
			}
		}

		if (!options.silent) {
			this.trigger('prepend', acceptedModels);
		}

		return acceptedModels;
	},

	unshift: function () {
		return this.prependModels(Array.prototype.slice.call(arguments, 0));
	},

	appendJSON: function (json, options) {
		if (!json || !json.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var models = [], model;
		for (var i = 0, _len = json.length; i < _len; i++) {
			model = this.constructor.buildModel(json[i]);
			if (!this.options.unique || this.modelCIDs.indexOf(model.cid) === -1) {
				this.modelCIDs.push(model.cid);
				models.push(model);
			}
		}

		if (!options.silent) {
			this.trigger('append', models);
		}

		return models;
	},

	appendModels: function (models, options) {
		if (!models || !models.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var acceptedModels = [], model;
		for (var i = 0, _len = models.length; i < _len; i++) {
			model = models[i];
			if (!this.options.unique || this.modelCIDs.indexOf(model.cid) === -1) {
				this.modelCIDs.push(model.cid);
				acceptedModels.push(model);
			}
		}

		if (!options.silent) {
			this.trigger('append', acceptedModels);
		}

		return acceptedModels;
	},

	appendCIDs: function (cids, options) {
		if (!cids || !cids.length) {
			return [];
		}
		if (!options) {
			options = {};
		}

		var acceptedModels = [], cid, model;
		for (var i = 0, _len = cids.length; i < _len; i++) {
			cid = cids[i];
			if (!this.options.unique || this.modelCIDs.indexOf(cid) === -1) {
				model = this.constructor.find({cid: cid});
				if (!model) {
					continue;
				}
				this.modelCIDs.push(cid);
				acceptedModels.push(model);
			}
		}

		if (!options.silent) {
			this.trigger('append', acceptedModels);
		}

		return acceptedModels;
	},

	push: function () {
		return this.appendModels(Array.prototype.slice.call(arguments, 0));
	}
});

})();
