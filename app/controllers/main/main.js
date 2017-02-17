/*global angular */
angular.module('GRPApp')
    .controller('MainCtrl', function ($scope, grpService, iapService, esriAuth, $state, $rootScope, iap) {
        'use strict';

        $scope.$state = $state;
        $scope.iap = iap;
        $scope.GRP = grpService;

        //make sure we've authenticated prior to loading secure layer
        // if (esriAuth.authenticated === true) {

            $scope.layers = [grpService.Sites.layer, grpService.Sites.Strategies.Booms.layer];
            // clear feature layer selection on returning to home or switching between iap and site
            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
                if (toState.name === 'main' ||
                    (toState.name.indexOf('main.site') > -1 && fromState.name.indexOf('main.iap') > -1) ||
                    (toState.name.indexOf('main.iap') > -1 && fromState.name.indexOf('main.site') > -1)) {
                    grpService.Sites.layer.clearSelection();
                    iapService.layer.clearSelection();
                }

                if (toState.name === 'main') {
                    if (iapService.clickListener.active === false) {
                        iapService.clickListener.add();
                    } else if (grpService.Sites.clickListener.active === false) {
                        grpService.Sites.clickListener.add();
                    }
                }
            });


        // } else {
        //     esriAuth.authenticate();
        // }
    });