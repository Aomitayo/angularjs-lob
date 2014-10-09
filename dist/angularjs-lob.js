(function() {


'use strict';

// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Grunt

// Config
angular.module('angularjsLob.config', [])
	.value('angularjsLob.config', {
		debug: true
	});

// Modules
angular.module('angularjsLob.directives', []);
angular.module('angularjsLob.filters', []);
angular.module('angularjsLob.services', ['restangular']);
angular.module('angularjsLob', [
	'angularjsLob.config',
	'angularjsLob.directives',
	'angularjsLob.filters',
	'angularjsLob.services'
]);

'use strict';

angular.module('angularjsLob.directives')
.directive('resourceView', ['$compile', '$controller', '$parse', '$q', 'resourceViews', function ($compile, $controller, $parse, $q, resourceViews) {
	return {
		template:'<div class="resourceView"><i class="icon-spin icon-spinner"></i></div>',
		replace: false,
		restrict: 'A',
		compile: function(tElement, tAttrs){
			return function postLink(scope, element, attrs){
				element.addClass('is-loading');
				function showView(resource){
					var view = attrs.view;
					resourceViews.controllerFor(view, resource).then(function(ctrl){
						if(ctrl){
							$controller(ctrl, {$scope:scope});
						}
					});
					resourceViews.templateFor(view, resource).then(function(tpl){
						var domEl = $compile(tpl)(scope);
						element.empty().append(domEl).removeClass('loading');
					});
				}

				scope.$watch(attrs.resource, showView);
			};
		}
	};
}]);
'use strict';

/* jshint sub:true */

angular.module('angularjsLob.services')
.constant('resourceCollection', function(collection){
	var self = collection || this;

	// if(!angular.isArray(self)){
	// 	throw new Array('Resource collection should be mixed unto an array');
	// }

	self._revision = 0;

	self.revision = function(){
		return self._revision;
	};

	self._updateRevision = function(){
		this._revision = Math.abs(Math.random() * (10000-1000)) +1000;
	};

	self.append = function(item, doNotRevise){
		self.push(item);
		if(!doNotRevise){this._updateRevision();}
	};

	self.appendItems = function(items, doNotRevise){
		angular.forEach(items, function(item){
			self.push(item);
		});
		if(!doNotRevise){this._updateRevision();}
	};

	self.prepend = function(item){
		self.unshift(item);
		this._updateRevision();
	};

	self.prependItems = function(items){
		angular.forEach(items, function(item){
			self.unshift(item);
		});
		this._updateRevision();
	};
	self.insert = function(index, item){
		self.splice(index, 0, item);
		this._updateRevision();
	};

	self.insertItems = function(index, items){
		var self = this;
		angular.forEach(items.reverse(), function(item){
			self.insert(index, item);
		});
		this._updateRevision();
	};

	self.removeItem = function(item, compareIds){
		var index = this.itemIndex(item, compareIds);
		if(index !== -1){
			self.splice(index, 1);
			this._updateRevision();
		}
	};

	self.removeAll = function(){
		self.splice(0, self.length);
		this._updateRevision();
	};

	self.replaceItem = function(item, replacement){
		var index = this.itemIndex(item);
		if(index !== -1){
			self.splice(index, 1, replacement);
			this._updateRevision();
		}
	};

	self.itemIndex = function(item, compareIds){
		var compare = this.compareItems;
		if(typeof compareIds === 'function'){
			compare = compareIds;
		}
		else if(typeof compareIds === 'boolean' && compareIds){
			compare = this.compareItems;
		}
		else{
			compare = undefined;
		}

		var index = self.indexOf(item);
		if(index === -1 && compare){
			for(var i=0; i< self; i++){
				if(compare(item, self[i])){
					return i;
				}
			}
			return -1;
		}
		else{
			return index;
		}
		
	};

	self.compareItems = function(i1, i2, prop){
		prop = prop || 'id';
		return i1[prop] && i2[prop]? i1[prop] === i2[prop]: false;
	};
});

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
'use strict';

angular.module('angularjsLob.services')
.factory('ResourceCursor', ['$q', 'resourceCollection', function($q, resourceCollection){

	function ResourceCursor(model, params, items){
		var self = this;
		resourceCollection(self);

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
'use strict';

angular.module('angularjsLob.services')
.provider('resourceViewTemplates', function () {
		var configs = {};
		var resourceTypeIdentifierFn = function(resource){
			resource = resource || {};
			return typeof resource === 'string'? resource :
				(resource.typeName && resource.typeName());
		};

		this.resourceTypeIdentifier = function(fn){
			resourceTypeIdentifierFn = fn;
		};
		
		this.urlFor = function(resourceType, view, templateUrl){
			configs[resourceType] = configs[resourceType] || {};
			configs[resourceType][view] = configs[resourceType][view] || {};
			configs[resourceType][view].url = templateUrl;
		};

		this.contentFor = function(resourceType, view, templateContent){
			configs[resourceType] = configs[resourceType] || {};
			configs[resourceType][view] = configs[resourceType][view] || {};
			configs[resourceType][view].content = templateContent;
		};
		
		// Method for instantiating
		this.$get = ['$q', '$injector', '$http', '$templateCache', function ($q, $injector, $http, $templateCache) {

			return {
				get: function(view, resource){
					var resourceType = resourceTypeIdentifierFn(resource);

					var templateDeferred = $q.defer();
					
					var resourceConfig = configs[resourceType];

					if(resourceConfig){
						var viewConfig = resourceConfig[view];
						if(viewConfig && viewConfig.url){
							$q.when(viewConfig.url)
							.then(function(url){
								return angular.isFunction(viewConfig.url) || angular.isArray(viewConfig.url)?
									$injector.invoke(viewConfig.url, {}, {resource:resource}) : url;
							})
							.then(function(url){
								var fromCache = $templateCache.get(url);
								if(fromCache){
									return fromCache;
								}
								else{
									$templateCache.put(url, $http.get(url)
									.then(function(response){
										$templateCache.put(url, response.data);
										return response.data;
									}));
									return $templateCache.get(url);
								}
							})
							.then(function(content){
								templateDeferred.resolve(content);
							}, function(err){
								templateDeferred.reject(err);
							});
						}
						else if(viewConfig && viewConfig.content){
							$q.when(viewConfig.content)
							.then(function(content){
								return angular.isFunction(viewConfig.content) || angular.isArray(viewConfig.content)?
									$injector.invoke(viewConfig.content, {}, {resource:resource}) : content;
							})
							.then(function(content){
								templateDeferred.resolve(content);
							}, function(err){
								templateDeferred.reject(err);
							});
						}
						else{
							templateDeferred.reject('No Template Configuration was found for ' + view + ' view of the ' + resourceType + ' resource');
						}
					}
					else{
						templateDeferred.reject('No Template Configuration was found for ' + resourceType);
					}
					return templateDeferred.promise;
				}
			};
		}];
	});

'use strict';

angular.module('angularjsLob.services')
.provider('resourceViews', function () {
  var configs = {};
  var resourceTypeIdentifierFn = function(resource){
    resource = resource || {};
    return typeof resource === 'string'? resource :
      (resource.typeName && resource.typeName());
  };

  this.resourceTypeIdentifier = function(fn){
    resourceTypeIdentifierFn = fn;
  };
  
  this.templateUrlFor = function(resourceType, view, templateUrl){
    configs[resourceType] = configs[resourceType] || {};
    configs[resourceType][view] = configs[resourceType][view] || {};
    configs[resourceType][view].url = templateUrl;
  };

  this.templateFor = function(resourceType, view, templateContent){
    configs[resourceType] = configs[resourceType] || {};
    configs[resourceType][view] = configs[resourceType][view] || {};
    configs[resourceType][view].content = templateContent;
  };
  
  this.uiStateFor = function(resourceType, view, state){
    configs[resourceType] = configs[resourceType] || {};
    configs[resourceType][view] = configs[resourceType][view] || {};
    configs[resourceType][view].uiState = state;
  };

  this.controllerFor = function(resourceType, view, controller){
    configs[resourceType] = configs[resourceType] || {};
    configs[resourceType][view] = configs[resourceType][view] || {};
    configs[resourceType][view].controller = controller;
  };

  // Method for instantiating
  this.$get = ['$q', '$injector', '$http', '$templateCache', function ($q, $injector, $http, $templateCache) {

    function viewAspect(aspect, formatter){
      return function(view, resource){
        var resourceType = resourceTypeIdentifierFn(resource);

        var deferred = $q.defer();
        
        var resourceConfig = configs[resourceType];

        if(resourceConfig){
          var theAspect = (resourceConfig[view] || {})[aspect] || (resourceConfig.all || {})[aspect];
          if(theAspect){
            $q.when(theAspect)
            .then(function(vAspect){
              return angular.isFunction(vAspect) || angular.isArray(vAspect)?
                $injector.invoke(vAspect, {}, {resource:resource}) : vAspect;
            })
            .then(function(vAspect){
              return formatter? formatter(vAspect) : vAspect;
            })
            .then(function(vAspect){
              deferred.resolve(vAspect);
            }, function(err){
              deferred.reject(err);
            });
          }
          else{
            deferred.resolve(null);
          }
        }
        else{
          deferred.resolve(null);
        }

        return deferred.promise;
      };
    }

    return {
      templateFor: function(view, resource){
        var resourceType = resourceTypeIdentifierFn(resource);

        var templateDeferred = $q.defer();
        
        var resourceConfig = configs[resourceType];

        if(resourceConfig){
          var viewConfig = resourceConfig[view];
          if(viewConfig && viewConfig.url){
            $q.when(viewConfig.url)
            .then(function(url){
              return angular.isFunction(viewConfig.url) || angular.isArray(viewConfig.url)?
                $injector.invoke(viewConfig.url, {}, {resource:resource}) : url;
            })
            .then(function(url){
              var fromCache = $templateCache.get(url);
              if(fromCache){
                return fromCache;
              }
              else{
                $templateCache.put(url, $http.get(url)
                .then(function(response){
                  $templateCache.put(url, response.data);
                  return response.data;
                }));
                return $templateCache.get(url);
              }
            })
            .then(function(content){
              templateDeferred.resolve(content);
            }, function(err){
              templateDeferred.reject(err);
            });
          }
          else if(viewConfig && viewConfig.content){
            $q.when(viewConfig.content)
            .then(function(content){
              return angular.isFunction(viewConfig.content) || angular.isArray(viewConfig.content)?
                $injector.invoke(viewConfig.content, {}, {resource:resource}) : content;
            })
            .then(function(content){
              templateDeferred.resolve(content);
            }, function(err){
              templateDeferred.reject(err);
            });
          }
          else{
            templateDeferred.reject('No Template Configuration was found for ' + view + ' view of the ' + resourceType + ' resource');
          }
        }
        else{
          templateDeferred.reject('No Template Configuration was found for ' + resourceType);
        }
        return templateDeferred.promise;
      },
      uiStateFor:viewAspect('uiState', function(theState){
        return typeof theState === 'string'? {name:theState} : theState;
      }),
      controllerFor: viewAspect('controller')
    };
  }];
});
}());