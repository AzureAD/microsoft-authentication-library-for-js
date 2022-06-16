'use strict';
angular.module('todoApp')
    .controller('homeCtrl', ['$scope', 'msalAuthenticationService', '$location', '$log', '$http', '$rootScope', function ($scope, msalService, $location, $log, $http, $rootScope) {
        $scope.login = function () {
            if (window.popUp) {
                msalService.loginPopup();
            } else {
                msalService.loginRedirect();
            }
        };
       
        $scope.logout = function () {
            msalService.logout();
        };
        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };

    }]);