/**
 * Created by Travis on 2/1/2017.
 */
'use strict';
var root = require('./root.po.js');

beforeEach(function () {
    browser.driver.get('http://localhost:63342/GRPApp/app/#/');
});

describe('creating a site', function () {

    it('should create empty site', function () {
        var rootPage = new root();
        rootPage.createSiteButton.click();
        expect(browser.getCurrentUrl()).toMatch('/GRPApp/app/#/site/new/general');
    });

});

describe('create an IAP', function () {

    it('should load empty IAP', function () {
        var rootPage = new root();
        rootPage.createIAPButton.click();
        expect(browser.getCurrentUrl()).toMatch('/GRPApp/app/#/iap/new/general');
    });
});