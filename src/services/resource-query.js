'use strict';

angular.module('angularjsLob.services')
.factory('ResourceQuery', ['$q', 'ResourceCursor', function($q, ResourceCursor){

	function ResourceQuery(model, params){
		this.model = model;
		this.params = params;
	}

	ResourceQuery.prototype.offset = function(offset){
		this.params.offset = offset;
	};

	ResourceQuery.prototype.limit = function(limit){
		this.params.limit = limit;
	};

	ResourceQuery.prototype.execute = function(){
		var self = this;

		return self.model.getList(self.params).then(function(items){
			items = items || [];
			
			return new ResourceCursor(self.model, self.params, items);
		});
	};

	return ResourceQuery;
}]);