'use strict';
console.log('homeController loaded');
angular.module('todoApp')
    .controller('homeCtrl', ['$scope', 'msalAuthenticationService', '$location', '$log', '$http', '$rootScope', function ($scope, msalService, $location, $log, $http, $rootScope) {
        $scope.login = function () {
            msalService.loginPopup();
        };
       
        $scope.logout = function () {
            msalService.logout();
        };
        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };

    }]);