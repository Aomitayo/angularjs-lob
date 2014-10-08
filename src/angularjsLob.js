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
