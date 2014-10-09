'use strict';

angular.module('angularjsLob.services')
.factory('resourceModelFactory', ['Restangular', function(Restangular){
	return function(config){
		if(!config.route || !config.typeName){
			throw new Error('ResourceModel must have route and typename');
		}
		var ResourceModel = Restangular.allUrl(config.route);
		ResourceModel.create = function(data){
			data = data || {};
			//data = Restangular.restangularizeElement(ResourceModel, data, config.route);
			data = Restangular.restangularizeElement(ResourceModel, data, '');
			data.typeName = function(){
				return config.typeName;
			};
			return data;
		};

		Restangular.extendModel(ResourceModel.route, function(model){
			model.copy = function(){
				return Restangular.copy(model);
			};
			model.typeName = function(){
				return config.typeName;
			};
			return model;
		});

		return ResourceModel;
	};
}]);
