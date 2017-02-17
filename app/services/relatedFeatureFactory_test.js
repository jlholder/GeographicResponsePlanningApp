/**
 * Created by Travis on 1/29/2017.
 */

angular.module('mock.services', [])
    .service('esriAuth', function () {
        return {userName: 'Test.User'};
    });

describe('Related Feature Factory Controller', function () {
    var relatedFeatureFactory, esriAuth, esriLoader;

    beforeEach(module('GRPApp'));

    beforeEach(module('mock.services'));

    beforeEach(inject(function (_relatedFeatureFactory_, _esriAuth_, esriLoader) {
        var feature = {
            _layer: {
                fields: [{name: 'a'}, {name: 'b'}],
                templates: [{prototype: {toJson: function () {return {};}}}],
                applyEdits: function (adds, updates, deletes, callback) {
                    callback(adds, updates, deletes);
                }
            },
            attributes: {GlobalID: 'new', actual_created_user: null, actual_last_edited_user: null}
        };
        relatedFeatureFactory = _relatedFeatureFactory_(feature, '_FK', 'foreignKey');
        esriAuth = _esriAuth_;
    }));

    it('should be defined', function () {
        expect(relatedFeatureFactory).toBeDefined();
    });

    it('should convert fields from array to object', function () {
        expect(typeof relatedFeatureFactory === 'object').toBe(true);
    });

    it('should set foreign key field value', function () {
        expect(relatedFeatureFactory.attributes._FK).toBe('foreignKey');
    });

    describe('relatedFeatureFactory.save()', function () {
        it('should add esriAuth.username', function () {
            relatedFeatureFactory.save(false, false);
            expect(relatedFeatureFactory.attributes.actual_created_user).toBe('Test.User');
            expect(relatedFeatureFactory.attributes.actual_last_edited_user).toBe('Test.User');
        });

        it('should update when globalid is not \'new\'', function () {
            relatedFeatureFactory.save();
            relatedFeatureFactory.attributes.GlobalID = 'not_new';
            esriAuth.userName = 'Another.User';
            relatedFeatureFactory.save(false, false);
            expect(relatedFeatureFactory.attributes.actual_created_user).toBe('Test.User');
            expect(relatedFeatureFactory.attributes.actual_last_edited_user).toBe('Another.User');
        })
    });
});

