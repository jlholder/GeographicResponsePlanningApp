/**
 * Created by Travis on 11/20/2015.
 */
/*jslint todo: true */
/*global angular */
/*global window */
/*global console */
angular.module('GRPApp')
    .provider('iapService', function () {
        'use strict';

        var config = {
            serviceRoot: '',
            iapsLayer: '',
            categoriesLayer: '',
            objectivesLayer: '',
            assignmentListsLayer: '',
            assignmentListContactsLayer: '',
            assignmentListResourcesLayer: ''
        }, iapService = {};

        return {
            config: function (value) {
                config = value;
            },
            $get: ['$q', 'arcgisService', 'esriLoader', 'contactService', 'mapService', 'drawService', 'editService',
                '$state', 'relatedObjectFactory', 'relatedContactFactory', '$mdToast',
                function ($q, arcgis, esriLoader, contactService, mapService, drawService, editService,
                          $state, relatedObjectFactory, relatedContactFactory, $mdToast) {
                    var deferred = $q.defer(),
                        SimpleMarkerSymbol,
                        SimpleLineSymbol,
                        Color,
                        FeatureLayer,
                        Graphic,
                        Point,
                        Polygon,
                        symbol,
                        Query,
                        Geoprocessor,
                        Circle,
                        FeatureSet,
                        SpatialReference,
                        SimpleFillSymbol;

                    function _loadModule() {
                        esriLoader.require(['esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Color',
                                'esri/layers/FeatureLayer', 'esri/graphic', 'esri/geometry/Point', 'esri/geometry/Polygon', 'esri/tasks/query',
                                'esri/tasks/Geoprocessor', 'esri/geometry/Circle', 'esri/tasks/FeatureSet', 'esri/SpatialReference',
                                'esri/symbols/SimpleFillSymbol'],
                            function (_SimpleMarkerSymbol, _SimpleLineSymbol, _Color, _FeatureLayer, _Graphic, _Point,
                                      _Polygon, _Query, _Geoprocessor, _Circle, _FeatureSet, _SpatialReference, _SimpleFillSymbol) {
                                SimpleLineSymbol = _SimpleLineSymbol;
                                SimpleMarkerSymbol = _SimpleMarkerSymbol;
                                Color = _Color;
                                FeatureLayer = _FeatureLayer;
                                Graphic = _Graphic;
                                Point = _Point;
                                Polygon = _Polygon;
                                Query = _Query;
                                Geoprocessor = _Geoprocessor;
                                Circle = _Circle;
                                FeatureSet = _FeatureSet;
                                SpatialReference = _SpatialReference;
                                SimpleFillSymbol = _SimpleFillSymbol;
                                symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 14,
                                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1.25),
                                    new Color([0, 255, 255]));
                                deferred.resolve();
                            });
                    }

                    _loadModule();

                    function grpPromise(promise) {
                        promise.finally(function () {
                            iapService.loading = false;
                        });
                        return promise;
                    }

                    function grpDefer() {
                        iapService.loading = true;
                        return $q.defer();
                    }
                    var listener;
                    iapService = {
                        plan: {},
                        getIAP: function () {
                            return deferred.promise;
                        },
                        query: function (searchText) {
                            var deferredResults = grpDefer();
                            iapService.getIAP().then(function () {
                                var query = new Query();
                                query.where = "Name like '%" + searchText + "%'";
                                //query.outFields = ['NAME'];
                                query.returnGeometry = false;
                                iapService.layer.queryFeatures(query, function (featureSet) {
                                    deferredResults.resolve(featureSet.features);
                                }, function (e) {
                                    console.log(e);
                                });
                            });
                            return grpPromise(deferredResults.promise);
                        },
                        loading: false,
                        clickListener: {
                            add: function () {
                                listener = iapService.layer.on('click', function (e) {
                                    $state.go('main.iap.general', {planid: e.graphic.attributes.GlobalID});
                                });
                                iapService.clickListener.active = true;
                            },
                            remove: function () {
                                listener.remove();
                                iapService.clickListener.active = false;
                            },
                            active: false
                        },
                        init: function () {
                            iapService.getIAP().then(function () {
                                iapService.layer = new FeatureLayer(config.serviceRoot + config.iapsLayer,
                                    {outFields: ["*"]});
                                iapService.layer.on('load', function () {
                                    var symbol = new SimpleFillSymbol(iapService.layer.renderer.symbol);
                                    symbol.setStyle(SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL);
                                    iapService.layer.setSelectionSymbol(symbol);
                                    // line.setWidth(2);
                                    // line.setColor(new Color([0, 255, 197, 1]));
                                    // var fill = new SimpleFillSymbol();
                                    // fill.setColor(new Color([0, 0, 0, 1]));
                                    // fill.setStyle(SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL);
                                    // fill.setOutline(line);
                                });
                                mapService.addLayer(iapService.layer);

                                //iapService.layer.setSelectionSymbol(symbol);
                                iapService.clickListener.add();
                            });
                        },
                        layer: null,
                        get: function (globalId, objectId) {
                            var deferredResults = grpDefer();
                            if (globalId === 'new' || objectId === 'new') {
                                iapService.plan = new Graphic(iapService.layer.templates[0].prototype.toJson());

                                // geometry needs to be initialized separately otherwise direct user entry will not work
                                iapService.plan.geometry = new Polygon();

                                iapService.plan.attributes.OBJECTID = 'new';

                                iapService.plan.fields = {};
                                angular.forEach(iapService.layer.fields, function (field) {
                                    iapService.plan.fields[field.name] = field;
                                });

                                iapService.plan.setSymbol(iapService.layer.renderer.symbol);

                                //remove click listener in case one polygon starts inside another (not completely
                                // necessary but may be less confusing to users)
                                iapService.clickListener.remove();
                                drawService.drawPolygon(function (geometry) {
                                    iapService.plan.setGeometry(geometry);
                                    mapService.addGraphic(iapService.plan);
                                    drawService.stop();
                                    editService.edit_verticies(iapService.plan);
                                    //restart click listener
                                    iapService.clickListener.add();
                                });
                                deferredResults.resolve();
                            } else {
                                arcgis.getFeature(iapService.layer, globalId, objectId).then(function (plan) {
                                    iapService.plan = plan.feature;
                                    //iapService.plan.coordinates = plan.feature.coordinates;
                                    iapService.plan.originalImageId = iapService.plan.attributes.CoverImage;

                                    if (iapService.plan.fields === undefined) {
                                        iapService.plan.fields = {};
                                        angular.forEach(iapService.layer.fields, function (field) {
                                            iapService.plan.fields[field.name] = field;
                                        });
                                    }
                                    editService.edit_verticies(plan.feature, function (geometry) {
                                        iapService.plan.geometry = geometry;
                                    });

                                    mapService.center(plan.feature.geometry);
                                    deferredResults.resolve();
                                });
                            }
                            return grpPromise(deferredResults.promise);
                            //return arcgis.getFeature(iapService.layer, globalId, objectId);
                        },
                        save: function () {
                            if (iapService.plan.geometry.rings.length === 0) {
                                $mdToast.show({
                                    template: '<md-toast ><div class="md-toast-content" md-colors="{background:\'warn-600\'}">' +
                                    'Please draw polygon before saving.</div></md-toast>',
                                    hideDelay: 6000
                                });
                            } else {
                                if (iapService.plan.attributes.OBJECTID === 'new') {
                                    $mdToast.show({
                                        'template': '<md-toast><div class="md-toast-content">Creating new plan... <span flex></span>' +
                                        '<md-progress-circular md-mode="indeterminate" class="md-accent" md-diameter="25"></md-progress-circular>' +
                                        '</div></md-toast>',
                                        'hideDelay': 0
                                    });
                                    var deferredResults = grpDefer();
                                    arcgis.addFeature(iapService.layer, iapService.plan).then(function (result) {
                                        mapService.clearMap();
                                        iapService.layer.refresh();
                                        iapService.get(null, result[0].objectId).then(function () {
                                            var innerDefered = $q.defer();
                                            var promises = [innerDefered.promise];
                                            angular.forEach(['AssignmentList', 'ICS234', 'IncidentCategories'], function (value) {
                                                promises.push(iapService[value].defaults.load(null, null, "GlobalID like '%'").then(function (defaults) {
                                                    angular.forEach(defaults, function (defaultItem) {
                                                        promises.push(iapService[value].create(iapService.plan.attributes.GlobalID).then(function (item) {
                                                            angular.forEach(item.attributes, function (value, attributeKey) {
                                                                if (!value) {
                                                                    item.attributes[attributeKey] = defaultItem.attributes[attributeKey];
                                                                }
                                                            });
                                                            promises.push(item.save(null, false).then(function () {
                                                                var subDefautls;
                                                                if (value === 'IncidentCategories') {
                                                                    subDefautls = ['IncidentObjectives'];
                                                                } else if (value === 'ICS234') {
                                                                    subDefautls = ['ICS234Strategies', 'ICS234Tactics'];
                                                                } else {
                                                                    subDefautls = [];
                                                                }
                                                                angular.forEach(subDefautls, function (value) {
                                                                    promises.push(iapService[value].defaults.load(defaultItem.attributes.GlobalID).then(function (subDefaults) {
                                                                        angular.forEach(subDefaults, function (subDefaultItem) {
                                                                            promises.push(iapService[value].create(item.attributes.GlobalID).then(function (subItem) {
                                                                                angular.forEach(subItem.attributes, function (value, attributeKey) {
                                                                                    if (!value) {
                                                                                        subItem.attributes[attributeKey] = subDefaultItem.attributes[attributeKey];
                                                                                    }
                                                                                });
                                                                                promises.push(subItem.save(null, false));
                                                                            }));
                                                                        });
                                                                    }));
                                                                });
                                                            }).finally(function () {
                                                                innerDefered.resolve();
                                                            }));
                                                        }));
                                                    });
                                                }));
                                            });
                                            $q.all(promises).then(function () {
                                                $mdToast.hide();
                                                deferredResults.resolve();
                                            });
                                        });
                                    });
                                    return deferredResults.promise;
                                }


                                return arcgis.updateFeature(iapService.layer, iapService.plan);
                            }
                        },
                        delete: function (feature) {
                            return arcgis.deleteFeature(iapService.layer, feature);
                        },
                        print: function (feature) {

                            var defered = grpDefer();
                            iapService.getIAP().then(function () {
                                var center = feature.geometry.getCentroid();
                                var print_gp = new Geoprocessor(config.reportService),
                                    // area_of_interest = new Circle(center, {"radius": 1}),
                                    // aoi_graphic = new Graphic(area_of_interest),
                                    featureSet = new FeatureSet(),
                                    gp_params = {f: 'json', AOI: featureSet};
                                featureSet.features = [feature];
                                print_gp.outSpatialReference = new SpatialReference(102100);

                                print_gp.submitJob(gp_params, function (e) {
                                    // in geoprocessing service the output paramater must be name ReportName
                                    // todo: add config for report name field name?
                                    if (e.jobStatus === "esriJobFailed") {
                                        $mdToast.show({
                                            template: '<md-toast ><div class="md-toast-content" md-colors="{background:\'warn-600\'}">' +
                                            'Error</div></md-toast>',
                                            hideDelay: 6000
                                        });
                                    } else {
                                        print_gp.getResultData(e.jobId, 'File', function (result) {
                                            window.open(result.value.url);
                                        });
                                    }
                                    defered.resolve(e);
                                });
                            });
                            return grpPromise(defered.promise);

                        },
                        IncidentCategories: new relatedObjectFactory(config.categoriesLayer, 'ActionPlan_FK', config.categoriesDefaultsLayer),
                        IncidentObjectives: new relatedObjectFactory(config.objectivesLayer, 'Category_FK', config.objectivesDefaultsLayer),
                        MedicalPlan: new relatedObjectFactory(config.medicalPlanLayer, 'ActionPlan_FK'),
                        RelatedContacts: new relatedContactFactory(config.iapContacts, 'ActionPlan_FK'),
                        ICS205Contacts: new relatedContactFactory(config.ics205Contacts, 'ActionPlan_FK'),
                        AssignmentList: new relatedObjectFactory(config.assignmentListsLayer, 'ActionPlan_FK', config.assignmentListsDefaultsLayer),
                        AssignmentListContacts: new relatedContactFactory(config.assignmentListContactsLayer, 'AssignmentList_FK'),
                        AssignmentListResources: new relatedObjectFactory(config.assignmentListResourcesLayer, 'AssignmentList_FK'),
                        ICS234: new relatedObjectFactory(config.ics234ObjectivesLayer, 'ActionPlan_FK', config.ics234ObjectivesDefaultsLayer),
                        ICS234Strategies: new relatedObjectFactory(config.ics234StrategiesLayer, 'Objective_FK', config.ics234StrategiesDefaultsLayer),
                        ICS234Tactics: new relatedObjectFactory(config.ics234TacticsLayer, 'Objective_FK', config.ics234TacticsDefaultsLayer),
                        getAttachments: function (objectId) {
                            return arcgis.getAttachments(iapService.layer, objectId);
                        },
                        uploadAttachment: function (objectId, formData) {
                            return arcgis.uploadAttachments(iapService.layer, objectId, formData);
                        },
                        deleteAttachment: function (objectId, attachmentId) {
                            return arcgis.deleteAttachments(iapService.layer, objectId, attachmentId);
                        }
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
                    runInit(iapService);

                    return iapService;
                }]
        };
    })
;