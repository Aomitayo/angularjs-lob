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