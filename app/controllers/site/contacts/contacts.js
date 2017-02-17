/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('ContactsCtrl', function ($scope, grpService, $stateParams, $state ) {
        'use strict';
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('main.site.contacts')) {
                grpService.RelatedContacts.load($stateParams.siteid).then(function (contacts) {
                    $scope.contacts = contacts;
                });
            }
        });


    })
    .filter('contactType', function () {
        'use strict';
        return function (input, string) {
            if (input === 1) {
                return string;
            }
        };
    });