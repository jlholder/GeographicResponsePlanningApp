/**
 * Created by Travis on 12/24/2015.
 */
'use strict';
/*global angular */
angular.module('GRPApp')
    .controller('StrategyCtrl', function ($scope, $q, grpService, $state, $stateParams, strategy, $filter, $mdDialog,
                                          Graphic, UniqueValueRenderer) {
        var boomsDeferred,
            renderer;

        //$scope.editActive = false;

        boomsDeferred = $q.defer();
        $scope.boomsPromise = boomsDeferred.promise;

        $scope.strategy = strategy;

        $scope.strategiesPromise.then(function () {
            loadStrategy();
        });

        function loadStrategy() {
            // is this better than hitting the service again?
            if ($stateParams.strategyid === 'new') {
                $scope.strategy = new Graphic(grpService.Sites.Strategies.layer.templates[0].prototype.toJson());
                $scope.strategy.attributes.Site_FK = $scope.GRP.site.attributes.GlobalID;

                $scope.strategy.fields = {};
                angular.forEach(grpService.Sites.Strategies.layer.fields, function (field, i) {
                    $scope.strategy.fields[field.name] = field;
                });

                grpService.Sites.Strategies.Booms.layer.clearSelection();
            } else {
                angular.forEach($scope.GRP.site.strategies, function (s, i) {
                    if (s.attributes.GlobalID === $stateParams.strategyid) {
                        $scope.strategy.attributes = $scope.GRP.site.strategies[i].attributes;
                        $scope.strategy.fields = {};
                        angular.forEach(grpService.Sites.Strategies.layer.fields, function (field, i) {
                            $scope.strategy.fields[field.name] = field;
                        });
                        loadBooms();
                    }
                });
            }
        }

        function loadBooms() {
            $scope.strategy.boom = {};

            grpService.Sites.Strategies.Booms.layer.clearSelection();

            grpService.Sites.Strategies.Booms.get($stateParams.strategyid).then(function (boom) {
                $scope.strategy.boom.features = boom.features;
                $scope.strategy.boom.fields = boom.fields;

                renderer = new UniqueValueRenderer(grpService.Sites.Strategies.Booms.defaultSymbol, "GlobalID");

                boomsDeferred.resolve();
            });
        }

        $scope.toggleBoom = function (id, visible) {
            grpService.Sites.Strategies.Booms.setVisiblity(id, visible);
        };

        $scope.saveStrategy = function () {
            if ($scope.strategy.attributes.GlobalID) {
                grpService.Sites.Strategies.update($scope.strategy).then(function (results) {
                    $state.go('main.site.strategies');
                });
            } else {
                $scope.strategy.attributes.Site_FK = $scope.GRP.site.attributes.GlobalID;
                grpService.Sites.Strategies.add($scope.strategy).then(function (results) {
                    grpService.Sites.Strategies.get(null, results[0].objectId).then(function (data) {
                        $scope.GRP.site.strategies.push(data[0]);
                        $state.go('main.site.strategies.strategy', {strategyid: data[0].attributes.GlobalID});
                    });
                });
            }
        };

        $scope.deleteStrategy = function (ev) {

            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .title('Delete?')
                .textContent('Are you sure you want to delete this strategy?')
                .ariaLabel('')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');
            $mdDialog.show(confirm).then(function () {
                grpService.Sites.Strategies.delete($scope.strategy).then(function (results) {
                    var deleted_strategy,
                        delete_index;
                    deleted_strategy = $filter('filter')($scope.GRP.site.strategies,
                        {attributes: {OBJECTID: results[0].objectId}})[0];
                    delete_index = $scope.GRP.site.strategies.indexOf(deleted_strategy);
                    $scope.GRP.site.strategies.splice(delete_index, 1);
                    $state.go('main.site.strategies');
                });
            });
        };

        $scope.highlightBoom = function (boom) {
            renderer.addValue(boom.attributes.GlobalID, grpService.Sites.Strategies.Booms.highlightedSymbol);
            grpService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        $scope.removeBoomHighlight = function (boom) {
            renderer.removeValue(boom.attributes.GlobalID);
            grpService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        //reload booms in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.current.name === 'main.site.strategies.strategy' && $state.params.strategyid !== 'new') {
                loadBooms();
            }
        });
    })
    .filter('boomType', function ($filter) {
        return function (input, domain) {
            return $filter('filter')(domain, {code: input})[0].name;
        };
    });