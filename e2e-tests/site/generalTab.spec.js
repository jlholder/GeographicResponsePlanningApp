/**
 * Created by Travis on 2/1/2017.
 */
var GeneralTab = require('./general.po.js');



describe('general tab form', function () {
    beforeEach(function () {
        browser.driver.get('http://localhost:63342/GRPApp/app/#/site/new/general');
    });

    it('should accept inputs', function () {
        var generalTab = new GeneralTab();

        generalTab.nameInput.sendKeys('Some site name');
        expect(generalTab.nameInput.getAttribute('value')).toBe('Some site name');

        generalTab.otherNameInput.sendKeys('Some site other name');
        expect(generalTab.otherNameInput.getAttribute('value')).toBe('Some site other name');

        generalTab.siteIdInput.sendKeys('Some site id');
        expect(generalTab.siteIdInput.getAttribute('value')).toBe('Some site id');

    });

    it('should not save without point', function () {
        var generalTab = new GeneralTab();

        generalTab.saveButton.click();
        expect(browser.getCurrentUrl()).toBe('http://localhost:63342/GRPApp/app/#/site/new/general');
    });
});