/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .controller('SiteCtrl', function ($scope, $q, $state, $stateParams, $mdDialog,
                                      $mdToast, grpService, mapService, editService, drawService, iapService) {
        'use strict';

        $scope.siteMode = true;
        //$scope.site = site;
        //$scope.site = grpService.site;
        var siteDeferred = $q.defer();
        $scope.sitePromise = siteDeferred.promise;

        function startEditing(feature) {
            editService.move(feature, function (geometry) {
                grpService.projectPoint(geometry).then(function (point) {
                    $scope.GRP.site.geometry = point;
                });
            });
        }

        function loadSite() {
            if ($stateParams.siteid === 'new') {
                grpService.createSite();
            } else {
                grpService.editSite($stateParams.siteid);
            }

            $scope.$on('$destroy', function () {
                editService.stop();
                drawService.stop();
                mapService.clearMap();
            });

            $scope.save = function () {
                if ($scope.GRP.site.attributes.OBJECTID === 'new') {

                    grpService.Sites.add($scope.GRP.site).then(function (result) {

                        mapService.clearMap();
                        grpService.Sites.layer.refresh();
                        grpService.Sites.get(null, result[0].objectId).then(function (site) {
                            $state.go('main.site.general', {siteid: site.feature.attributes.GlobalID});
                        });

                    });
                } else {
                    grpService.Sites.update($scope.GRP.site);
                }

            };

            $scope.delete = function (site, ev) {
                // Appending dialog to document.body to cover sidenav in docs app
                var confirm = $mdDialog.confirm()
                    .title('Delete?')
                    .textContent('Are you sure you want to delete this sensitive site and all related information?')
                    .ariaLabel('Delete')
                    .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');
                $mdDialog.show(confirm).then(function () {
                    grpService.Sites.delete(site).then(function () {
                        $state.go('main');
                    });
                });
            };

            $scope.export = function (site) {
                $mdToast.show({
                    'template': '<md-toast><div class="md-toast-content">Loading...<span flex></span>' +
                    '<md-progress-circular md-mode="indeterminate" class="md-accent" md-diameter="25"></md-progress-circular>' +
                    '</div></md-toast>',
                    'hideDelay': 0
                });
                $scope.exportLoading = true;
                grpService.Sites.print(site).finally(function () {
                    $scope.exportLoading = false;
                    $mdToast.hide();
                });
            };
        }

        mapService.getMap().then(function (map) {
            if (grpService.Sites.layer.loaded === true) {
                loadSite(map);
            } else {
                map.on('layers-add-result', function () {
                    loadSite(map);
                });
            }
        });

    });