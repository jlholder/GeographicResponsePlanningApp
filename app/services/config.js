/**
 * Created by Travis on 12/14/2016.
 */
/*jslint todo: true */
/*global angular */
/*global window */
/*global console */
angular.module('GRPApp')
    .provider('config', function () {
        'use strict';

        var config = {
            serviceRoot: '',
            iapsLayer: '',
            categoriesLayer: '',
            objectivesLayer: '',
            assignmentListsLayer: '',
            assignmentListContactsLayer: ''
        };

        return {
            config: function (value) {
                config = value;
            },
            $get: function () {
                return config;
            }
        };
    });