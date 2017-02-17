/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('AttachmentsCtrl', function ($scope, grpService) {
        'use strict';
        $scope.layer = grpService.Sites;
    });