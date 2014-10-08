'use strict';

angular.module('angularjsLob.services')
.factory('ResourceCursor', ['$q', 'resourceCollection', function($q, resourceCollection){

	function ResourceCursor(model, params, items){
		var self = this;
		resourceCollection(this);

		self.isLoading = false;
		self.isEof = false;
		self.model = model;
		self.params = params;

		if(items){
			this.appendItems(items);
		}

		this.more = function(){
			self.isLoading = true;
			var queryArgs =  angular.extend({}, self.params, {skip:self.length, limit:10});

			model.getList(queryArgs).then(function(items){
				items = items || [];
				
				self.appendItems(items, true);
				self.params = queryArgs;
				self.isLoading = false;
				self.isEof = items.length === 0;

				if(items.pagination){
					self.count = items.pagination.count;
				}
				else if(items.length === 0){
					self.count = self.length;
				}
				return items;
			});
		};
	}

	ResourceCursor.prototype = [];

	return ResourceCursor;
}]);
