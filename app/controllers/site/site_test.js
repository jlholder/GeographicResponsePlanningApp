/**
 * Created by Travis on 1/29/2017.
 */

angular.module('mock.services', [])
    .service('mapService', function ($q) {
        var mapService;
        mapService = {
            getMap: function () {
                return $q.when();
            },
            clearMap: function () {
                return $q.when();
            }
        };
        return mapService;
    })
    .service('editService', function () {
        return {};

    })
    .service('drawService', function () {
        return {};
    })
    .service('grpService', function ($q) {
        var grpService;

        grpService = {
            createSite: function () {
                grpService.site = {attributes: {OBJECTID: 'new'}, geometry: {x:null, y:null}, fields: {}};
                return $q.when();
            }
        };
        return grpService;
    });

describe('Site Controller', function () {
    var ctrl, $scope, grpService;

    beforeEach(module('GRPApp'));

    beforeEach(module('mock.services'));

    beforeEach(inject(function($controller, $rootScope, _mapService_, _editService_, _drawService_, _grpService_) {
        $scope = $rootScope.$new();
        grpService = _grpService_;

        ctrl = $controller('SiteCtrl', {
            $scope: $scope,
            mapService: _mapService_,
            editService: _editService_,
            drawService: _drawService_,
            grpService: _grpService_
        });
    }));

    it('should be defined', function () {
        expect(ctrl).toBeDefined();
    });
});

