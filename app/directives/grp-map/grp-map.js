/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .directive('grpMap', function () {
        'use strict';
        return {
            restrict: 'E',
            scope: {
                layers: '='
            },
            template: '<md-content layout-gt-xs="column" layout="row" style="min-height: 200px;" flex id="mapDiv"></md-content>',
            replace: true,
            controller: function ($scope, mapService) {
                mapService.loadMap('mapDiv').then(function () {
                    mapService.addLayers($scope.layers);
                });
            }
        };
    });