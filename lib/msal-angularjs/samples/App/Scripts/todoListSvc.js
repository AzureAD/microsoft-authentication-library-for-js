'use strict';
angular.module('todoApp')
.factory('todoListSvc', ['$http', function ($http) {
    return {
        getItems : function(){
            return $http.get(applicationConfig.apiEndpoint);
        },
        postItem : function(item){
            return $http.post(applicationConfig.apiEndpoint,item);
        },
    };
}]);