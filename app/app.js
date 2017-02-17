/*global angular */

angular.module('GRPApp', ['oc.lazyLoad', 'ui.router', 'ngMaterial', 'LocalStorageModule', 'ngMessages', 'esri.core',
    'md.data.table'])
    .service('IdentityManager', function ($q, esriLoader, localStorageService, config) {
        'use strict';

        var identityManagerDeferred = $q.defer();

        function loadManager() {
            esriLoader.require(['esri/IdentityManager', 'esri/arcgis/OAuthInfo'],
                function (IdentityManager, OAuthInfo) {
                    var info = new OAuthInfo({
                        appId: config.appId,
                        popup: false,
                        expiration: 1440,
                        portalUrl: config.portalUrl
                    });
                    if (localStorageService.get('arcgis_creds') !== null) {
                        IdentityManager.initialize(JSON.stringify(localStorageService.get('arcgis_creds')));
                    } else {
                        IdentityManager.registerOAuthInfos([info]);
                    }
                    identityManagerDeferred.resolve(IdentityManager);
                });
        }

        loadManager();
        return {
            getIdentityManager: function () {
                return identityManagerDeferred.promise;
            }
        };
    })
    .service('Portal', function ($q, esriLoader, config) {
        'use strict';
        var portalDeferred = $q.defer();

        function loadPortal() {
            esriLoader.require('esri/arcgis/Portal').then(function (Portal) {
                var portal = new Portal.Portal(config.portalUrl);
                portalDeferred.resolve(portal);
            });
        }

        loadPortal();
        return {
            getPortal: function () {
                return portalDeferred.promise;
            }
        };
    })
    .service('esriAuth', function ($q, $window, localStorageService, IdentityManager, Portal, config) {
        'use strict';

        return {
            fullName: '',
            userName: '',
            authenticated: false,
            authenticate: function (token, username, expires) {
                var myThis = this,
                    authenticateDefer = $q.defer();
                IdentityManager.getIdentityManager().then(function (IdentityManager) {
                    Portal.getPortal().then(function (portal) {

                        if (token !== undefined && username !== undefined) {
                            IdentityManager.registerToken({
                                expires: expires,
                                server: config.portalUrl + '/sharing',
                                ssl: true,
                                token: token,
                                userId: username
                            });
                        }

                        IdentityManager.checkSignInStatus(config.portalUrl + "/sharing").then(
                            function () {
                                portal.signIn().then(
                                    function (portalUser) {
                                        myThis.fullName = portalUser.fullName;
                                        myThis.userName = portalUser.username;
                                        myThis.authenticated = true;

                                        var id_manager_json = IdentityManager.toJson();

                                        //id_manager_json.credentials[0].fullName = portalUser.fullName;

                                        //console.log("Signed in to the portal: ", portalUser);
                                        localStorageService.set('arcgis_creds', id_manager_json);
                                        authenticateDefer.resolve();
                                    }
                                ).otherwise(
                                    function () {
                                        //console.log("Error occurred while signing in: ", error);
                                        authenticateDefer.reject();
                                    }
                                );
                            }
                        ).otherwise(
                            function () {
                                IdentityManager.getCredential(config.portalUrl + "/sharing");
                                //console.log(e);
                            }
                        );


                    });
                });
                return authenticateDefer.promise;
            },
            logout: function () {
                //var w = wish.get();
                this.userName = null;
                this.fullName = null;
                this.authenticated = false;
                IdentityManager.getIdentityManager().then(function (IdentityManager) {
                    IdentityManager.destroyCredentials();
                });
                localStorageService.clearAll();
                $window.location.reload();
            },
            getUserDetails: function () {
                //var w = wish.get(),
                var myThis = this,
                    detailsDefer = $q.defer();
                IdentityManager.getIdentityManager().then(function (IdentityManager) {
                    Portal.getPortal().then(function (portal) {
                        //if (localStorageService.get('arcgis_creds') !== null) {
                        //    IdentityManager.initialize(JSON.stringify(localStorageService.get('arcgis_creds')));
                        //}

                        IdentityManager.checkSignInStatus(config.portalUrl + "/sharing").then(
                            function () {
                                portal.signIn().then(
                                    function (portalUser) {
                                        myThis.fullName = portalUser.fullName;
                                        myThis.userName = portalUser.username;
                                        myThis.authenticated = true;

                                        var id_manager_json = IdentityManager.toJson();

                                        //id_manager_json.credentials[0].fullName = portalUser.fullName;

                                        //console.log("Signed in to the portal: ", portalUser);
                                        localStorageService.set('arcgis_creds', id_manager_json);
                                        detailsDefer.resolve();
                                    }
                                ).otherwise(
                                    function () {
                                        //console.log("Error occurred while signing in: ", error);
                                        detailsDefer.resolve();
                                    }
                                );
                            }
                        ).otherwise(
                            function () {
                                //console.log(e);
                                detailsDefer.resolve();
                            }
                        );
                    });
                });
                return detailsDefer.promise;
            }
        };
    })
    .service('site', function () {
        'use strict';
        this.attributes = [];
        this.geometry = {};
        this.fields = [];
    })
    .service('regex', function () {
        'use strict';
        this.phone = [];
        this.geometry = {};
        this.fields = [];
    })
    .service('iap', function () {
        'use strict';
        this.attributes = [];
        this.geometry = {};
        this.fields = [];
    })
    .service('strategy', function () {
        'use strict';
        this.attributes = [];
        this.fields = [];
    })
    .service('contact', function () {
        'use strict';
        this.attributes = {};
    })
    .service('category', function () {
        'use strict';
        this.attributes = [];
        this.fields = [];
    })
    .service('regex', function(){
        'use strict';
        //create service to check phone format
        this.emailFormat = '\\S+@\\S+\\.\\S+';
        this.phoneFormat = '(?:(?:\\+?1\\s*(?:[.-]\\s*)?)?(?:\\(\\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\\s*\\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\\s*(?:[.-]\\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\\s*(?:[.-]\\s*)?([0-9]{4})(?:\\s*(?:#|x\\.?|ext\\.?|extension)\\s*(\\d+))?|(911)';
        this.phoneMessage = 'Please enter a valid phone number.';
        this.emailMessage = 'Please enter a valid email.';
    })
    .config(['$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider', '$mdThemingProvider', '$mdIconProvider',
        'grpServiceProvider', 'iapServiceProvider', 'contactServiceProvider', 'configProvider',
        function ($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, $mdThemingProvider, $mdIconProvider,
                  grpServiceProvider, iapServiceProvider, contactServiceProvider, configProvider) {
            'use strict';
            var serviceRoot = 'https://utility.arcgis.com/usrsvcs/servers/0fdf6a35174b4a76be078b5c028acca7/rest/services/R9GIS/IAPDev2/FeatureServer/';

            grpServiceProvider.config({
                serviceRoot: serviceRoot,
                sitesLayer: '0',
                strategiesLayer: '8',
                boomsLayer: '2',
                relationshipsLayer: '25',
                reportService: 'https://it.innovateteam.com/arcgis/rest/services/R9/SiteStrategyReport_v3/GPServer/Multi%20Page%20Report3'
            });

            iapServiceProvider.config({
                serviceRoot: serviceRoot,
                iapsLayer: '17',
                iapContacts: '26',
                categoriesLayer: '5',
                categoriesDefaultsLayer: '32',
                objectivesLayer: '6',
                objectivesDefaultsLayer: '40',
                assignmentListsLayer: '4',
                assignmentListsDefaultsLayer: '31',
                assignmentListContactsLayer: '24',
                assignmentListResourcesLayer: '28',
                medicalPlanLayer: '16',
                ics234ObjectivesLayer: '21',
                ics234StrategiesLayer: '22',
                ics234TacticsLayer: '20',
                ics234ObjectivesDefaultsLayer: '37',
                ics234StrategiesDefaultsLayer: '38',
                ics234TacticsDefaultsLayer: '39',
                ics205Contacts: '30',
                reportService: 'https://utility.arcgis.com/usrsvcs/servers/fbe8f30951264e1d9fe4573a43b79c2c/rest/services/R9GIS/IAPDevReport/GPServer/IAP'
            });

            configProvider.config({
                serviceRoot: serviceRoot,
                contactsLayer: '3',
                portalUrl: 'https://innovate.maps.arcgis.com',
                appId: "t3uLZDDg6AdWgFjz"

            });

            contactServiceProvider.config({
                serviceRoot: serviceRoot,
                contactsLayer: '3'
            });

            $mdThemingProvider.theme('default').primaryPalette('blue')
                .accentPalette('blue-grey');

            $mdIconProvider
                .iconSet('social', 'img/icons/sets/social-icons.svg', 24)
                .defaultIconSet('img/icons/sets/core-icons.svg', 24);

            $ocLazyLoadProvider.config({
                debug: false,
                events: true
            });

            $urlRouterProvider.otherwise('/');

            $stateProvider
                .state('access_token', {
                    url: '/access_token={access_token:.*}&expires_in={expires_in:.*}&username={username:.*}&state={state:.*}',
                    template: '',
                    controller: function ($stateParams, $state, esriAuth) {
                        var datetime = new Date(),
                            expires = datetime.getTime() + (parseInt($stateParams.expires_in, 10) * 1000);
                        esriAuth.authenticate($stateParams.access_token, $stateParams.username, expires);
                        $state.go('main');
                    }
                })
                .state('main', {
                    url: '/',
                    templateUrl: 'controllers/main/main.html',
                    controller: 'MainCtrl',
                    resolve: {
                        userInfo: function ($q, esriAuth) {
                            var defer = $q.defer();
                            esriAuth.getUserDetails().then(function () {
                                defer.resolve();
                            });
                            return defer.promise;
                        },
                        //Map: function (esriLoader) {
                        //    return esriLoader.require('esri/map').then(function (Map) {
                        //
                        //    });
                        //},
                        //Draw: function (esriLoader) {
                        //    return esriLoader.require('esri/toolbars/draw').then(function (Draw) {
                        //        return Draw;
                        //    });
                        //},
                        Graphic: function (esriLoader) {
                            return esriLoader.require('esri/graphic').then(function (Graphic) {
                                return Graphic;
                            });
                        },
                        Point: function (esriLoader) {
                            return esriLoader.require('esri/geometry/Point').then(function (Point) {
                                return Point;
                            });
                        },
                        //Edit: function (esriLoader) {
                        //    return esriLoader.require('esri/toolbars/edit').then(function (Edit) {
                        //        return Edit;
                        //    });
                        //},
                        //FeatureLayer: function (esriLoader) {
                        //    return esriLoader.require('esri/layers/FeatureLayer').then(function (Edit) {
                        //        return Edit;
                        //    });
                        //},
                        iapPromise: function (iapService) {
                            return iapService.getIAP();
                        },
                        grpPromise: function (grpService) {
                            return grpService.getModules();
                        },
                        contactPromise: function (contactService) {
                            return contactService.getContacts();
                        },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'directives/grp-toolbar/grp-toolbar.js',
                                    'directives/grp-map/grp-map.js',
                                    'directives/grp-header/grp-header.js',
                                    'controllers/main/main.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.site', {
                    url: 'site/:siteid',
                    templateUrl: 'controllers/site/site.html',
                    controller: 'SiteCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/site/site.js',
                                    'directives/grp-form-buttons/grp-form-buttons.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.site.general', {
                    url: '/general',
                    templateUrl: 'controllers/site/general/general.html',
                    controller: 'GeneralCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/site/general/general.js']
                            });
                        }
                    }
                })
                .state('main.site.resources', {
                    url: '/resources',
                    templateUrl: 'controllers/site/resources/resources.html',
                    controller: 'ResourcesCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/site/resources/resources.js']
                            });
                        }
                    }
                })
                .state('main.site.contacts', {
                    url: '/contacts',
                    templateUrl: 'controllers/site/contacts/contacts.html',
                    controller: 'ContactsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/site/contacts/contacts.js']
                            });
                        }
                    }
                })
                .state('main.site.contacts.contact', {
                    url: '/:contactid',
                    templateUrl: 'controllers/site/contacts/contact/contact.html',
                    controller: 'ContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/site/contacts/contact/contact.js']
                            });
                        }
                    }
                })
                .state('main.site.strategies', {
                    url: '/strategies',
                    templateUrl: 'controllers/site/strategies/strategies.html',
                    controller: 'StrategiesCtrl',
                    resolve: {
                        SimpleLineSymbol: function (esriLoader) {
                            return esriLoader.require('esri/symbols/SimpleLineSymbol').then(function (SimpleLineSymbol) {
                                return SimpleLineSymbol;
                            });
                        },
                        Color: function (esriLoader) {
                            return esriLoader.require('esri/Color').then(function (Color) {
                                return Color;
                            });
                        },
                        UniqueValueRenderer: function (esriLoader) {
                            return esriLoader.require('esri/renderers/UniqueValueRenderer').then(function (UniqueValueRenderer) {
                                return UniqueValueRenderer;
                            });
                        },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/site/strategies/strategies.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.site.strategies.strategy', {
                    url: '/:strategyid',
                    templateUrl: 'controllers/site/strategies/strategy/strategy.html',
                    controller: 'StrategyCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/site/strategies/strategy/strategy.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.site.strategies.strategy.boom', {
                    url: '/boom/:boomid',
                    templateUrl: 'controllers/site/strategies/strategy/boom/boom.html',
                    controller: 'BoomCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/site/strategies/strategy/boom/boom.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.site.attachments', {
                    url: '/attachments',
                    templateUrl: 'controllers/site/attachments/attachments.html',
                    controller: 'AttachmentsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/site/attachments/attachments.js',
                                    'directives/file-upload/file-upload.js',
                                    'directives/attachment-view/attachment-view.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap', {
                    url: 'iap/:planid',
                    templateUrl: 'controllers/iap/iap.html',
                    controller: 'IAPCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/iap.js',
                                    'directives/grp-form-buttons/grp-form-buttons.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.general', {
                    url: '/general',
                    templateUrl: 'controllers/iap/general/general.html',
                    controller: 'GeneralCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/general/general.js',
                                    'directives/attachment-view/attachment-view.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.objectives', {
                    url: '/objectives',
                    templateUrl: 'controllers/iap/objectives/objectives.html',
                    controller: 'ObjectivesCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/objectives/objectives.js',
                                    'directives/drag/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.objectives.category', {
                    url: '',
                    params: {
                        categoryid: null
                    },
                    templateUrl: 'controllers/iap/objectives/category/category.html',
                    controller: 'CategoryCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/objectives/category/category.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.assignments', {
                    url: '/assignments',
                    templateUrl: 'controllers/iap/assignments/assignments.html',
                    controller: 'AssignmentsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/assignments/assignments.js'
                                ]
                            });
                        },
                        assignments: function (iapService, $stateParams) {
                            return iapService.AssignmentList.load($stateParams.planid).then(function (assignments) {
                                return assignments;
                            });
                        }
                    }
                })
                .state('main.iap.assignments.assignment', {
                    url: '/:assignmentid',
                    templateUrl: 'controllers/iap/assignments/assignment/assignment.html',
                    controller: 'AssignmentCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/assignments/assignment/assignment.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.assignments.assignment.contact', {
                    url: '/contact',
                    params: {contactid: null},
                    templateUrl: 'controllers/iap/assignments/assignment/contact/contact.html',
                    controller: 'ContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/assignments/assignment/contact/contact.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.assignments.assignment.resource', {
                    url: '/resource',
                    params: {resourceid: null},
                    templateUrl: 'controllers/iap/assignments/assignment/resource/template.html',
                    controller: 'ResourceController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/assignments/assignment/resource/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.contacts', {
                    url: '/contacts',
                    templateUrl: 'controllers/iap/contacts/contacts.html',
                    controller: 'ContactsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/iap/contacts/contacts.js']
                            });
                        }
                    }
                })
                .state('main.iap.contacts.contact', {
                    url: '/:contactid',
                    templateUrl: 'controllers/iap/contacts/contact/contact.html',
                    controller: 'ContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/iap/contacts/contact/contact.js']
                            });
                        }
                    }
                })
                .state('main.iap.medical', {
                    url: '/medical',
                    templateUrl: 'controllers/iap/medical/medical.html',
                    controller: 'MedicalCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/iap/medical/medical.js']
                            });
                        }
                    }
                })
                .state('main.iap.medical.contact', {
                    url: '/contact',
                    templateUrl: 'controllers/iap/medical/contact/contact.html',
                    controller: 'MedicalContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/iap/medical/contact/contact.js']
                            });
                        }
                    }
                })
                .state('main.iap.attachments', {
                    url: '/attachments',
                    templateUrl: 'controllers/iap/attachments/attachments.html',
                    controller: 'AttachmentsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/attachments/attachments.js',
                                    'directives/file-upload/file-upload.js',
                                    'directives/attachment-view/attachment-view.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.ics234', {
                    url: '/ics234',
                    templateUrl: 'controllers/iap/ics234/objectives.html',
                    controller: 'ICS234Controller',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/ics234/objectives.js',
                                    'directives/drag/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.ics234.objective', {
                    url: '',
                    params: {
                        objectiveid: null
                    },
                    templateUrl: 'controllers/iap/ics234/objective/objective.html',
                    controller: 'ICS234ObjectiveController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/ics234/objective/objective.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.contacts', {
                    url: 'contacts',
                    templateUrl: 'controllers/contacts/list/template.html',
                    controller: 'ContactsListController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'directives/grp-header/grp-header.js',
                                    'directives/grp-toolbar/grp-toolbar.js',
                                    'controllers/contacts/list/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.ics205', {
                    url: '/ics205',
                    templateUrl: 'controllers/iap/ics205/template.html',
                    controller: 'ICS205Controller',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/ics205/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.ics205.contact', {
                    url: '/:contactid',
                    params: {team:null},
                    templateUrl: 'controllers/iap/ics205/contact/contact.html',
                    controller: 'ICS205ContactController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/ics205/contact/contact.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.defaults', {
                    url: 'defaults',
                    templateUrl: 'controllers/defaults/template.html',
                    controller: 'DefaultsController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/defaults/controller.js',
                                    'directives/list-view/controller.js',
                                    'directives/form-view/controller.js',
                                    'directives/grp-form-buttons/grp-form-buttons.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.defaults.objectives', {
                    url: '/objectives',
                    templateUrl: 'controllers/defaults/objectives/template.html',
                    controller: 'ObjectivesDefaultsController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/defaults/objectives/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.defaults.ics234', {
                    url: '/ics234',
                    templateUrl: 'controllers/defaults/ics234/template.html',
                    controller: 'ICS234DefaultsController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/defaults/ics234/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.defaults.assignments', {
                    url: '/assignments',
                    templateUrl: 'controllers/defaults/assignments/template.html',
                    controller: 'AssignmentsDefaultsController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/defaults/assignments/controller.js'
                                ]
                            });
                        }
                    }
                });
        }])
    .filter('display', function ($filter) {
        'use strict';
        return function (input, displayOptions) {
            if (displayOptions === 'boolean') {
                // TODO: fix boolean
                if (input === 1 || input === true) {
                    return "Yes";
                } else if (input === 0 || input === false) {
                    return "No";
                } else {
                    return "";
                }
            } else if (input === undefined || input === '') {
                return "";
            } else if (displayOptions !== undefined) {
                var displayObject = $filter('filter')(displayOptions, {code: input}, true)[0];
                return (displayObject ? displayObject.name : input);
            }
        };
    });
