'use strict';
angular.module('angularjsLob.directives')
.directive('serverValidation', [function(){
	return {
		restrict:'A',
		require:'ngModel',
		link: function($scope, $element, $attr, ctrl){
			ctrl.$parsers.push(function(val){
				ctrl.$setValidity('serverValidation', true);
				return val;
			});
			$scope.$watch($attr.serverValidation, function(validation){
				ctrl.$setValidity('serverValidation', !!!validation);
			});
		}
	};
}]);