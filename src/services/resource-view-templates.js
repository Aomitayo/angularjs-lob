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
