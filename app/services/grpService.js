/**
 * Created by Travis on 11/20/2015.
 */
/*jslint todo: true */
/*global angular */
/*global window */
/*global console */
angular.module('GRPApp')
    .provider('grpService', function () {
        'use strict';

        var config = {
            serviceRoot: '',
            sitesLayer: '',
            strategiesLayer: '',
            boomsLayer: '',
            contactsLayer: '',
            relationshipsLayer: '',
            reportService: ''
        }, GRP = {};

        return {
            config: function (value) {
                config = value;
            },
            $get: ['$q', 'arcgisService', 'esriLoader', 'contactService', '$state', 'editService', 'mapService', 'drawService','relatedContactFactory', '$mdToast', 'iapService',
                function ($q, arcgis, esriLoader, contactService, $state, editService, mapService, drawService,relatedContactFactory, $mdToast, iapService) {
                    function _startEditing(feature) {
                        editService.move(feature, function (geometry) {
                            GRP.projectPoint(geometry).then(function (point) {
                                GRP.site.coordinates = point;
                            });
                        });
                    }

                    var deferred = $q.defer(),
                        symbol,
                        Query,
                        FeatureLayer,
                        Geoprocessor,
                        Circle,
                        FeatureSet,
                        Graphic,
                        SpatialReference,
                        Point,
                        listener;

                    function _loadModules() {
                        esriLoader.require(['esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Color',
                                'esri/tasks/query', 'esri/layers/FeatureLayer', 'esri/tasks/Geoprocessor', 'esri/geometry/Circle',
                                'esri/tasks/FeatureSet', 'esri/graphic', 'esri/SpatialReference', 'esri/geometry/Point'],
                            function (SimpleMarkerSymbol, SimpleLineSymbol, Color, _Query, _FeatureLayer, _Geoprocessor,
                                      _Circle, _FeatureSet, _Graphic, _SpatialReference, _Point) {
                                symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 14,
                                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1.25),
                                    new Color([0, 255, 255]));
                                Query = _Query;
                                FeatureLayer = _FeatureLayer;
                                Geoprocessor = _Geoprocessor;
                                Circle = _Circle;
                                FeatureSet = _FeatureSet;
                                Graphic = _Graphic;
                                SpatialReference = _SpatialReference;
                                Point = _Point;
                                deferred.resolve();
                            });
                    }
                    _loadModules();

                    function grpPromise(promise) {
                        promise.finally(function () {
                            GRP.loading = false;
                        });
                        return promise;
                    }

                    function grpDefer() {
                        GRP.loading = true;
                        return $q.defer();
                    }

                    GRP = {
                        getModules: function () {
                            return deferred.promise;
                        },
                        site: {},
                        createSite: function () {
                            GRP.getModules().then(function () {
                                GRP.site = new Graphic(GRP.Sites.layer.templates[0].prototype.toJson());

                                // geometry needs to be initialized separately otherwise direct user entry will not work
                                GRP.site.geometry = new Point();

                                GRP.site.attributes.OBJECTID = 'new';

                                GRP.site.fields = {};
                                angular.forEach(GRP.Sites.layer.fields, function (field) {
                                    GRP.site.fields[field.name] = field;
                                });

                                GRP.site.setSymbol(symbol);

                                // draw.activate(Draw.POINT);
                                iapService.clickListener.remove();
                                drawService.drawPoint(function (geometry) {

                                    GRP.site.setGeometry(geometry);
                                    mapService.addGraphic(GRP.site);

                                    GRP.projectPoint(geometry).then(function (point) {
                                        GRP.site.coordinates = point;
                                    });
                                    drawService.stop();
                                    iapService.clickListener.add();

                                    _startEditing(GRP.site);
                                });
                            });
                        },
                        editSite: function (id) {
                            if (GRP.site.attributes === undefined || GRP.site.attributes.GLOBALID !== id) {
                                GRP.Sites.get(id).then(function (site) {
                                    if (GRP.site.fields === undefined) {
                                        GRP.site.fields = {};
                                        angular.forEach(GRP.Sites.layer.fields, function (field) {
                                            GRP.site.fields[field.name] = field;
                                        });
                                    }
                                    GRP.site.attributes = site.feature.attributes;
                                    GRP.site.coordinates = site.feature.coordinates;

                                    //GRP.site = temp;
                                    _startEditing(site.feature);
                                    mapService.center(site.feature.geometry);
                                });
                            }
                        },
                        loading: false,
                        projectPoint: function (point, outSR) {
                            return arcgis.projectPoint(point, outSR);
                        },
                        query: function (searchText) {
                            var deferredResults = grpDefer();
                            GRP.getModules().then(function () {
                                var query = new Query();
                                query.where = "Name like '%" + searchText + "%'";
                                query.returnGeometry = false;
                                GRP.Sites.layer.queryFeatures(query, function (featureSet) {
                                    deferredResults.resolve(featureSet.features);
                                }, function (e) {
                                    console.log(e);
                                });
                            });
                            return grpPromise(deferredResults.promise);
                        },
                        Sites: {
                            clickListener: {
                                add: function () {
                                    listener = GRP.Sites.layer.on('click', function (e) {
                                        $state.go('main.site.general', {siteid: e.graphic.attributes.GlobalID});
                                    });
                                    GRP.Sites.clickListener.active = true;
                                },
                                remove: function () {
                                    listener.remove();
                                    GRP.Sites.clickListener.active = false;
                                },
                                active: false
                            },
                            init: function () {
                                GRP.getModules().then(function () {
                                    GRP.Sites.layer = new FeatureLayer(config.serviceRoot + config.sitesLayer,
                                        {outFields: ["*"]});
                                    GRP.Sites.layer.setSelectionSymbol(symbol);
                                    GRP.Sites.clickListener.add();
                                    // draw = new Draw(map);
                                });
                            },
                            layer: null,
                            get: function (globalId, objectId) {
                                return arcgis.getFeature(this.layer, globalId, objectId);
                            },
                            add: function (feature) {
                                var deferred = $q.defer();
                                arcgis.addFeature(this.layer, feature).then(function (result) {
                                    $mdToast.showSimple("Created");
                                    deferred.resolve(result);
                                });
                                return deferred.promise;
                            },
                            update: function (feature) {
                                return arcgis.updateFeature(this.layer, feature);
                            },
                            delete: function (feature) {
                                return arcgis.deleteFeature(this.layer, feature);
                            },
                            print: function (feature) {

                                var defered = grpDefer();
                                GRP.getModules().then(function () {
                                    var print_gp = new Geoprocessor(config.reportService),
                                        area_of_interest = new Circle(feature.geometry, {"radius": 1}),
                                        aoi_graphic = new Graphic(area_of_interest),
                                        featureSet = new FeatureSet(),
                                        gp_params = {f: 'json', AreaOfInterest: featureSet};
                                    featureSet.features = [aoi_graphic];
                                    print_gp.outSpatialReference = new SpatialReference(102100);

                                    print_gp.submitJob(gp_params, function (e) {
                                        // in geoprocessing service the output paramater must be name ReportName
                                        // todo: add config for report name field name?
                                        print_gp.getResultData(e.jobId, 'ReportName', function (result) {
                                            window.open(result.value.url);
                                        });
                                        defered.resolve(e);
                                    });
                                });
                                return grpPromise(defered.promise);

                            },
                            getAttachments: function (objectId) {
                                return arcgis.getAttachments(this.layer, objectId);
                            },
                            uploadAttachment: function (objectId, formData) {
                                return arcgis.uploadAttachments(this.layer, objectId, formData);
                            },
                            deleteAttachment: function (objectId, attachmentId) {
                                return arcgis.deleteAttachments(this.layer, objectId, attachmentId);
                            },
                            Strategies: {
                                init: function () {
                                    GRP.getModules().then(function () {
                                        GRP.Sites.Strategies.layer = new FeatureLayer(config.serviceRoot + config.strategiesLayer,
                                            {outFields: ["*"]});
                                    });
                                },
                                layer: null,
                                get: function (globalId, objectId) {
                                    return arcgis.getRelatedFeatures(this.layer, 'Site_FK', globalId, objectId);
                                },
                                add: function (feature) {
                                    return arcgis.addRelatedFeature(this.layer, feature);
                                },
                                update: function (feature) {
                                    return arcgis.updateRelatedFeature(this.layer, feature);
                                },
                                delete: function (feature) {
                                    return arcgis.deleteRelatedFeature(this.layer, feature);
                                },
                                setVisibility: function (globalId, visible) {
                                    GRP.getModules().then(function () {
                                        var selection_mode,
                                            query;
                                        if (visible === false) {
                                            selection_mode = FeatureLayer.SELECTION_SUBTRACT;
                                        } else if (visible === true) {
                                            selection_mode = FeatureLayer.SELECTION_ADD;
                                        }

                                        query = new Query();
                                        query.where = "Strategy_FK='" + globalId + "'";

                                        GRP.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode);
                                    });
                                },
                                Booms: {
                                    init: function () {
                                        GRP.getModules().then(function () {
                                            GRP.Sites.Strategies.Booms.layer = new FeatureLayer(config.serviceRoot + config.boomsLayer,
                                                {
                                                    outFields: ["*"],
                                                    mode: FeatureLayer.MODE_SELECTION
                                                });
                                        });
                                    },
                                    layer: null,
                                    defaultSymbol: null,
                                    highlightedSymbol: null,
                                    resetRenderer: function (renderer) {
                                        // remove old render, set new render and redraw layer
                                        GRP.Sites.Strategies.Booms.layer.render = null;
                                        GRP.Sites.Strategies.Booms.layer.setRenderer(renderer);
                                        GRP.Sites.Strategies.Booms.layer.redraw();
                                    },
                                    get: function (strategy_globalId, boom_globalId, visible, boom_objectId) {
                                        var featureDeferred = grpDefer();
                                        GRP.getModules().then(function () {
                                            var query = new Query(),
                                                selection_mode;

                                            if (strategy_globalId !== null) {
                                                query.where = "Strategy_FK='" + strategy_globalId + "'";

                                            } else if (boom_globalId !== null) {
                                                query.where = "GlobalID='" + boom_globalId + "'";
                                            } else if (boom_objectId !== null) {
                                                query.where = "OBJECTID='" + boom_objectId + "'";
                                            }
                                            if (visible === false) {
                                                selection_mode = FeatureLayer.SELECTION_SUBTRACT;
                                            } else {
                                                selection_mode = FeatureLayer.SELECTION_ADD;
                                            }

                                            query.outFields = ["*"];

                                            GRP.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode, function (features) {
                                                var data = {features: features};

                                                data.fields = {};
                                                angular.forEach(GRP.Sites.Strategies.Booms.layer.fields, function (field) {
                                                    data.fields[field.name] = field;
                                                });

                                                featureDeferred.resolve(data);

                                            }, function (e) {
                                                featureDeferred.reject(e);
                                            });
                                        });
                                        return grpPromise(featureDeferred.promise);
                                    },
                                    setVisiblity: function (globalId, visible) {
                                        GRP.getModules().then(function () {
                                            var selection_mode,
                                                query = new Query();
                                            if (visible === false) {
                                                selection_mode = FeatureLayer.SELECTION_SUBTRACT;
                                            } else if (visible === true) {
                                                selection_mode = FeatureLayer.SELECTION_ADD;
                                            }

                                            query.where = "GlobalID='" + globalId + "'";

                                            GRP.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode);
                                        });
                                    },
                                    add: function (feature) {
                                        return arcgis.addRelatedFeature(this.layer, feature);
                                    },
                                    update: function (feature) {
                                        return arcgis.updateRelatedFeature(this.layer, feature);
                                    },
                                    delete: function (feature) {
                                        return arcgis.deleteRelatedFeature(this.layer, feature);
                                    }
                                }
                            }

                        },
                        //Nest under GRP rather than site
                        RelatedContacts: new relatedContactFactory(config.relationshipsLayer, 'Site_FK')
                    };

                    // run all init functions
                    var runInit = function (obj) {
                        angular.forEach(obj, function (value, key) {
                            if (key === 'init') {
                                value();
                            } else if (angular.isObject(value) && key !== 'layer') {
                                runInit(value);
                            }
                        });
                    };
                    runInit(GRP);

                    return GRP;
                }]
        };
    });