/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('StrategiesCtrl', function ($scope, $q, grpService, $state, $stateParams, SimpleLineSymbol, Color, UniqueValueRenderer) {
        'use strict';
        var strategiesDeferred = $q.defer(),
            renderer;

        $scope.strategiesPromise = strategiesDeferred.promise;

        if (grpService.Sites.layer.loaded === true) {
            loadStrategies();
        } else {
            grpService.Sites.layer.on('load', function () {
                loadStrategies();
            });
        }

        function loadStrategies() {
            grpService.Sites.Strategies.get($stateParams.siteid).then(function (data) {
                $scope.GRP.site.strategies = data;
                //$scope.GRP.site.strategies.fields = data.fields;

                strategiesDeferred.resolve();

                if (grpService.Sites.Strategies.Booms.defaultSymbol === null) {
                    grpService.Sites.Strategies.Booms.defaultSymbol = grpService.Sites.Strategies.Booms.layer.renderer.symbol;

                    grpService.Sites.Strategies.Booms.highlightedSymbol = new SimpleLineSymbol(grpService.Sites.Strategies.Booms.defaultSymbol.toJson());
                    grpService.Sites.Strategies.Booms.highlightedSymbol.setWidth(4);
                    grpService.Sites.Strategies.Booms.highlightedSymbol.setColor(new Color([255, 170, 0, 1]));
                }

                loadBooms();
            });
        }

        function loadBooms() {
            renderer = new UniqueValueRenderer(grpService.Sites.Strategies.Booms.defaultSymbol, "Strategy_FK");

            angular.forEach($scope.GRP.site.strategies, function (strategy, i) {
                grpService.Sites.Strategies.Booms.get(strategy.attributes.GlobalID, null, strategy.visible)
                    .then(function (boom) {
                        strategy.booms = boom.features;
                    });
            });
        }

        $scope.viewStrategy = function (id) {
            $state.go('main.site.strategies.strategy', {strategyid: id});
        };

        $scope.toggleBooms = function (id, visible) {
            grpService.Sites.Strategies.setVisibility(id, visible);
        };


        // reload booms in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.current.name === 'main.site.strategies') {
                loadBooms();
            }
        });

        // when leaving this state clear boom features
        $scope.$on('$destroy', function () {
            grpService.Sites.Strategies.Booms.layer.clearSelection();
        });

        grpService.Sites.Strategies.Booms.layer.on('click', function (e) {
            $state.go('main.site.strategies.strategy.boom', {
                strategyid: e.graphic.attributes.Strategy_FK,
                boomid: e.graphic.attributes.GlobalID
            });
        });

        $scope.highlightStrategy = function (strategy) {
            renderer.addValue(strategy.attributes.GlobalID, grpService.Sites.Strategies.Booms.highlightedSymbol);
            grpService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        $scope.removeStrategyHighlight = function (strategy) {
            renderer.removeValue(strategy.attributes.GlobalID);
            grpService.Sites.Strategies.Booms.resetRenderer(renderer);
        };
    });