'use strict';
angular.module('todoApp')
    .controller('userProfileCtrl', ['$scope', 'msalAuthenticationService', '$http', function ($scope, msalService, $http) {

        var getUserProfileData = function () {
            $http.get(applicationConfig.userProfileEndpoint).then(function (response) {
                $scope.userProfile = response.data;

            }, function (error) {
                console.log(error);
            });
        }

        $scope.$on("msal:acquireTokenSuccess", function (event, tokenOut) {
        });

        $scope.$on("msal:acquireTokenFailure", function (event, errorDesc, error) {
            if (error.indexOf("consent_required") !== -1 || error.indexOf("interaction_required") != -1 ) {
                msalService.acquireTokenPopup(applicationConfig.userProfileScopes).then(function (token) {
                    getUserProfileData();
                }, function (error) {
                });
            }
        });

        getUserProfileData();

    }]);