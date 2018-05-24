'use strict';
angular.module('todoApp')
    .controller('calendarCtrl', ['$scope', 'msalAuthenticationService', '$http', function ($scope, msalService, $http) {

        $scope.claims = [];

        var updateImage = function (buffer) {
            var binary = '';
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            if (len < 1)
                $scope.img = null;
            else {
                for (var i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                $scope.img = window.btoa(binary);
            }
        }

        var updateCalendar = function (data) {
            var calendar_data = '';
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var prevDate = null;
            if (data.value == null || data.value.length < 1) {
                calendar_data += '<tr class="bold">';
                calendar_data += '<td>' + 'No events available' + '</td>';
                calendar_data += '</tr>';
                $("#calendar_table tr").remove();
                $('#calendar_table').append(calendar_data);
                return;
            }

            $.each(data.value, function (key, value) {
                var date = new Date(value.start.dateTime);
                var currentDate = date.toLocaleDateString("en-US", options);
                if (currentDate != prevDate) {
                    calendar_data += '<tr class="bold">';
                    calendar_data += '<td>' + currentDate + '</td>';
                    calendar_data += '</tr>';
                    prevDate = currentDate;
                }

                calendar_data += '<tr>';
                calendar_data += '<td>' + getTime(date) + " " + value.subject + '</td>';
                calendar_data += '</tr>';
            });

            $("#calendar_table tr").remove();
            $('#calendar_table').append(calendar_data);
        }


        var getImage = function () {
            $http.get(applicationConfig.photoEndpoint, { responseType: 'arraybuffer' }).then(function (response) {
                updateImage(response.data);

            }, function (error) {
                console.log(error);
            });
        }

        var getCalendar = function () {
            $http.get(applicationConfig.calendarEndpoint).then(function (response) {
                updateCalendar(response.data);

            }, function (error) {
                console.log(error);
            });
        }
       
        var getTime = function (date) {
            var utcDate = new Date(date.toUTCString());
            utcDate.setHours(utcDate.getHours() - 8);
            var usDate = new Date(utcDate);
            return formatAMPM(usDate);
        }

        var formatAMPM = function (date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
        }

        $scope.$on("msal:acquireTokenSuccess", function (event, tokenOut) {
        });

        $scope.$on("msal:acquireTokenFailure", function (event, errorDesc, error) {
            if (error.indexOf("consent_required") !== -1) {
                msalService.acquireTokenPopup(applicationConfig.graphScopes).then(function (token) {
                    getImage();
                    getCalendar();
                }, function (error) {
                });
            }
        });

        getImage();
        getCalendar();

    }]).directive('checkImage', function () {
        return {
            link: function (scope, element, attrs) {
                element.bind('error', function () {
                    element.attr('src', '/App/Images/no_photo.png'); // set default image
                });
            }
        }
    });