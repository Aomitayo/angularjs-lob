'use strict';

describe('', function() {

  var module;
  var dependencies;
  dependencies = [];

  var hasModule = function(module) {
    return dependencies.indexOf(module) >= 0;
  };

  beforeEach(function() {

    // Get module
    module = angular.module('angularjsLob');
    dependencies = module.requires;
  });
  
  it('should load config module', function() {
    expect(hasModule('angularjsLob.config')).to.be.ok;
  });

  
  it('should load filters module', function() {
    expect(hasModule('angularjsLob.filters')).to.be.ok;
  });
  

  
  it('should load directives module', function() {
    expect(hasModule('angularjsLob.directives')).to.be.ok;
  });
  

  
  it('should load services module', function() {
    expect(hasModule('angularjsLob.services')).to.be.ok;
  });

});