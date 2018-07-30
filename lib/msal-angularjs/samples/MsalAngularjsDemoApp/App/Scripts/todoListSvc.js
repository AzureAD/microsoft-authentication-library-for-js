'use strict';
angular.module('todoApp')
.factory('todoListSvc', ['$http', function ($http) {
    return {
        getItems : function(){
            return $http.get(applicationConfig.webApiEndpoint);
        },
        postItem : function(item){
            return $http.post(applicationConfig.webApiEndpoint,item);
        },
    };
}]);