/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .directive('grpToolbar', function ($q, $state, site, strategy, esriAuth, grpService, iapService, contact) {
        'use strict';
        return {
            restrict: 'E',
            scope: {
                state: '=state',
                altSearch: '&'
            },
            templateUrl: 'directives/grp-toolbar/grp-toolbar.html',
            controller: function ($scope) {
                $scope.GRP = grpService;
                $scope.IAP = iapService;
                $scope.strategy = strategy;
                $scope.authenticated = esriAuth.authenticated;

                $scope.getMatches = function (searchText) {
                    if (!$state.is('main.contacts')) {
                        var allPromises = [], allResults = [], deferredResults = $q.defer();
                        allPromises.push(grpService.query(searchText));
                        allPromises.push(iapService.query(searchText));

                        $q.all(allPromises).then(function (results) {
                            angular.forEach(results, function (result) {
                                allResults = allResults.concat(result);
                            });
                            deferredResults.resolve(allResults);
                        });
                        return deferredResults.promise;
                    } else {
                        return $scope.altSearch({searchText: searchText});
                    }
                };

                $scope.selectedItemChange = function (item) {
                    if (item) {
                        $scope.searchText = '';
                        if (grpService.Sites.layer.name === item._layer.name) {
                            $scope.siteMode = true;
                            $state.go('main.site.general', {siteid: item.attributes.GlobalID});
                        } else if (iapService.layer.name === item._layer.name) {
                            $scope.iapMode = true;
                            $state.go('main.iap.general', {planid: item.attributes.GlobalID});
                        }
                    }
                };

                $scope.go = function (target) {
                    $state.go(target);
                };
            }
        };
    });