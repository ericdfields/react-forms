/**
 * @jsx React.DOM
 */
'use strict';

var assert      = require('assert');

var schema      = require('../lib/schema');
var validators  = require('../lib/validators');
var validation  = require('../lib/validation');

var validate    = validation.validate;

var Schema      = schema.Schema;
var Property    = schema.Property;
var List        = schema.List;

describe('forms', () => {

  describe('validation', () => {

    function assertValidates(validation) {
      assert.strictEqual(validation.isSuccess, true, 'isSuccess should be true');
      assert.strictEqual(validation.isFailure, false, 'isFailure should be false');
    }

    function assertFails(validation) {
      assert.strictEqual(validation.isSuccess, false, 'isSuccess should be false');
      assert.strictEqual(validation.isFailure, true, 'isFailure should be true');
    }

    function assertSelfFails(validation, message) {
      assertFails(validation);
      assert.strictEqual(validation.validation.failure, message);
    }

    function assertChildrenFail(validation) {
      var keys = Array.prototype.slice.call(arguments, 1);
      assertFails(validation);
      assert.ok(validation.children);
      keys.forEach((key) =>
        assert.ok(validation.children[key] !== undefined));
      Object.keys(validation.children).forEach((key) =>
        assert.ok(keys.indexOf(key) > -1));
    }

    describe('scalar validation', () => {

      it('validates scalars', () => {
        var schema = <Property validate={validators.number} />;

        assertValidates(validate(schema, 1));
        assertValidates(validate(schema, '1'));
        assertSelfFails(validate(schema, 'x'), 'should be a number');
        assertValidates(validate(schema, null));
        assertValidates(validate(schema, undefined));
      });

      it('validates required scalars', () => {
        var schema = <Property required validate={validators.number} />;

        assertValidates(validate(schema, 1));
        assertValidates(validate(schema, '1'));
        assertSelfFails(validate(schema, 'x'), 'should be a number');
        assertSelfFails(validate(schema, null), 'value is required');
        assertSelfFails(validate(schema, undefined), 'value is required');
      });

    });

    describe('object validation', () => {

      it('validates object', () => {

        var schema = (
          <Schema>
            <Property name="name" />
            <Property name="count" validate={validators.number} />
            <Property name="dob" validate={validators.date} />
          </Schema>
        );

        var validation;

        assertValidates(validate(schema, {}));
        assertValidates(validate(schema, {name: 'name'}));
        assertValidates(validate(schema, {name: 'name', count: 1}));

        validation = validate(schema, {name: 'name', count: 'x'});
        assertFails(validation);
        assertChildrenFail(validation, 'count');
        assertFails(validation.children.count);

        validation = validate(schema, {name: 'name', count: 1, dob: '2012-12-12'});
        assertValidates(validation);
      });

      it('validates object w/ required fields', () => {

        var schema = (
          <Schema required>
            <Property name="name" required />
            <Property name="count" validate={validators.number} />
          </Schema>
        );

        var validation;

        assertValidates(validate(schema, {name: 'name'}));

        validation = validate(schema, {});
        assertChildrenFail(validation, 'name');
        assertFails(validation);
        assertFails(validation.children.name);

        assertSelfFails(validate(schema, null), 'value is required');
        assertSelfFails(validate(schema, undefined), 'value is required');
      });

      it('validates nested objects', () => {

        var schema = (
          <Schema> 
            <Property name="name" required />
            <Property name="count" validate={validators.number} />
            <Schema name="subschema" required>
              <Property name="name" required />
              <Property name="count" validate={validators.number} />
            </Schema>
          </Schema>
        );

        var validation;

        validation = validate(schema, {});
        assertFails(validation);
        assertChildrenFail(validation, 'name', 'subschema');
        assertFails(validation.children.name);
        assertFails(validation.children.subschema);

        validation = validate(schema, {subschema: {}});
        assertFails(validation);
        assertChildrenFail(validation, 'name', 'subschema');
        assertFails(validation.children.name);
        assertFails(validation.children.subschema);
        assertChildrenFail(validation.children.subschema, 'name');
        assertFails(validation.children.subschema.children.name);
      });
    });

    describe('array validation', () => {

      it('validates array', () => {

        var schema = (
          <List>
            <Property validate={validators.number} />
          </List>
        );

        var validation;

        assertValidates(validate(schema, []));

        validation = validate(schema, ['x']);
        assertFails(validation);
        assertFails(validation.children[0]);

        assertValidates(validate(schema, [1]));

        assertValidates(validate(schema, [1, 2]));

        validation = validate(schema, [1, 'x']);
        assertFails(validation);
        assertFails(validation.children[1]);
      });

    });

  });
});
