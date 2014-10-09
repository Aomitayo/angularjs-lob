'use strict';

angular.module('angularjsLob.services')
.provider('resourceContext', ['RestangularProvider', function(RestangularProvider){

	var _resourceModels = {};

	this.resourceModel = function(name, route, config){
		_resourceModels[name] = {
			config: angular.extend({typeName:name, route:route}, config||{})
		};
	};

	this.baseUrl = function(baseUrl){
		RestangularProvider.setBaseUrl(baseUrl);
	};

	this.dataAdapter = function(fn){
		RestangularProvider.addResponseInterceptor(fn);
	};

	this.$get = ['resourceModelFactory', 'ResourceQuery', function(resourceModelFactory, ResourceQuery){
		return {
			resourceModel: function(name){
				if(! _resourceModels[name]){
					throw  new Error( name + ' is not a known model. Ensure you have defined it');
				}
				_resourceModels[name].model = _resourceModels[name].model || resourceModelFactory(_resourceModels[name].config);
				return _resourceModels[name].model;
			},
			query: function(modelName, params){
				return new ResourceQuery(this.resourceModel(modelName), params);
			},
			find: function(modelName, params){
				return this.query(modelName, params).execute();
			}
		};
	}];
}]);