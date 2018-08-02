'use strict';
angular.module('todoApp')
    .controller('todoListCtrl', ['$scope', '$location', 'todoListSvc', 'msalAuthenticationService', function ($scope, $location, todoListSvc, msalService) {
        $scope.error = "";
        $scope.loadingMessage = "Loading...";
        $scope.todoList = null;
        $scope.editingInProgress = false;
        $scope.newTodoCaption = "";


        $scope.editInProgressTodo = {
            Description: "",
            ID: 0
        };

        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };

        $scope.populate = function () {
            todoListSvc.getItems().then(function (results) {
                $scope.todoList = results.data;
                $scope.loadingMessage = "";
            }, function (err) {
                if(err.data)
                    $scope.error = err.data;
                $scope.loadingMessage = "";
            })
        };

        $scope.add = function () {

            todoListSvc.postItem({
                'title': $scope.newTodoCaption,
            }).then(function (results) {
                $scope.loadingMsg = "";
                $scope.newTodoCaption = "";
                $scope.populate();
            }, function (err) {
                $scope.error = err;
                $scope.loadingMsg = "";
            })
        };

        $scope.$on("msal:acquireTokenFailure", function (event, errorDesc, error) {
                if (error.indexOf("consent_required") !== -1 || error.indexOf("interaction_required") != -1 ) {
                    msalService.acquireTokenPopup(applicationConfig.webApiScopes).then(function (token) {
                    todoListSvc.getItems().then(function (results) {
                        $scope.toGoList = results;
                        $scope.loadingMessage = "";
                    }, function (err) {
                        console.log("error " + err);
                        $scope.loadingMessage = "";
                    });
                }, function (error) {
                });
            }

        });

        $scope.$on("msal:acquireTokenSuccess", function (event, tokenOut) {
        });

    }]);
