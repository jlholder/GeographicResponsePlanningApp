/**
 * Created by Travis on 2/1/2017.
 */
var root = function () {
    this.createSiteButton = element(by.css('[ui-sref="main.site.general({siteid: \'new\'})"]'));
    this.createIAPButton = element(by.css('[ui-sref="main.iap.general({planid: \'new\'})"]'));

    this.searchInput = element(by.model('$mdAutocompleteCtrl.scope.searchText'));
};
module.exports = root;