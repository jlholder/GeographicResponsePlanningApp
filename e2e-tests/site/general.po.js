/**
 * Created by Travis on 2/1/2017.
 */
var generalTab = function () {
    this.nameInput = element(by.model('GRP.site.attributes.Name'));
    this.otherNameInput = element(by.model('GRP.site.attributes.Other_Name'));
    this.siteIdInput = element(by.model('GRP.site.attributes.Site_ID'));

    this.saveButton = element(by.css('[ng-click="save()"]'));

    this.mapDiv = element(by.id('mapDiv'));
};
module.exports = generalTab;