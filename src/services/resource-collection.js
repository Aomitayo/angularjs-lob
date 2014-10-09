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
