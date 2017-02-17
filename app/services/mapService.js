/**
 * Created by Travis on 10/12/2016.
 */
/**
 * Created by Travis on 10/5/2016.
 */
/*globals angular */
angular.module('GRPApp').service('mapService', function ($q, esriLoader, $timeout) {
    'use strict';

    var mapDeferred = $q.defer();

    var serviceObj = {
        loadMap: function (id) {
            esriLoader.require('esri/map', function (Map) {
                var map = new Map(id, {
                    basemap: "topo",
                    center: [144.76, 13.65],
                    zoom: 11,
                    autoResize: true
                });

                mapDeferred.resolve(map);
            });
            return mapDeferred.promise;
        },
        getMap: function () {
            return mapDeferred.promise;
        },
        clearMap: function () {
            serviceObj.getMap().then(function (map) {
                map.graphics.clear();
            });
        },
        addGraphic: function (graphic) {
            serviceObj.getMap().then(function (map) {
                map.graphics.add(graphic);
            });
        },
        addLayer: function (layer) {
            serviceObj.getMap().then(function (map) {
                map.addLayer(layer);
            });
        },
        addLayers: function (layers) {
            serviceObj.getMap().then(function (map) {
                map.addLayers(layers);
            });
        },
        center: function (geometry) {
            serviceObj.getMap().then(function (map) {
                // timeout helps make sure the map has time to adjust after slideout opens before trying to center the geometry
                // not perfect but seems to resolve the case 100% of the time
                $timeout(function () {
                    if (geometry.type === 'point') {
                        map.centerAt(geometry);
                    } else if (geometry.type === 'polygon') {
                        var center = geometry.getCentroid();
                        map.centerAt(center);
                    }
                }, 250);
            });
        }
    };


    return serviceObj;
    //var deferred = $q.defer();
    //esriLoader.require(['esri/tasks/query', 'esri/layers/FeatureLayer', 'esri/SpatialReference',
    //        'esri/tasks/ProjectParameters', 'esri/tasks/GeometryService', 'esri/graphic'],
    //    function (Query, FeatureLayer, SpatialReference, ProjectParameters, GeometryService, Graphic) {
    //
    //        deferred.resolve(arcgisService);
    //    });
    //return deferred.promise;
});