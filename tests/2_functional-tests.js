const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const isoDateRegExp = /^\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}.\d{3}Z$/;

chai.use(chaiHttp);

function assertAllFieldsMatchObj(obj, expected) {
  Object.keys(expected).forEach((field) => assert.equal(obj[field], expected[field], `field ${field} should equal ${obj[field]}`));
}

function assertAddedFieldsExistWithTypes(obj) {
  assert.isString(obj.created_on, 'field created_on should exist as string');
  assert.match(obj.created_on, isoDateRegExp, 'field updated_on should be an ISO date');
  assert.isString(obj.updated_on, 'field updated_on should exist as string');
  assert.match(obj.updated_on, isoDateRegExp, 'field updated_on should be an ISO date');
  assert.isBoolean(obj.open, 'field open should be a boolean');
  assert.isString(obj._id, 'field _id should be a string');
}

function assertOptionalFieldsDefaultValues(obj) {
  assert.equal(obj.assigned_to, '', 'field assigned_to should default to an empty string');
  assert.equal(obj.status_text, '', 'field status_text should default to an empty text');
}

suite('Functional Tests', function() {
  test('Create an issue with every field', function(done) {
    issue = {
      issue_title: 'Some issue_title',
      issue_text: 'Some issue issue_text',
      created_by: 'test-username',
      assigned_to: 'test-username',
      status_text: 'open',
    };
    chai
      .request(server)
      .post('/api/issues/test-project')
      .send(issue)
      .end((err, res) => {
        assertAllFieldsMatchObj(res.body, issue);
        assertAddedFieldsExistWithTypes(res.body);
        done();
      });
  });

  test('Create an issue with only required fields', function(done) {
    const issue = {
      issue_title: 'Some issue_title',
      issue_text: 'Some issue issue_text',
      created_by: 'test-username',
    };
    chai
      .request(server)
      .post('/api/issues/test-project')
      .send(issue)
      .end((err, res) => {
        assertAllFieldsMatchObj(res.body, issue);
        assertOptionalFieldsDefaultValues(res.body);
        assertAddedFieldsExistWithTypes(res.body);
        done();
      });
  });

  test('Create an issue with only required fields', function(done) {
    const issue = {
      // issue_title: 'Some issue_title',
      issue_text: 'Some issue issue_text',
      created_by: 'test-username',
    };
    chai
      .request(server)
      .post('/api/issues/test-project')
      .send(issue)
      .end((err, res) => {
        assert.equal(res.status, 400);
        assert.deepEqual(res.body, { error: 'required field(s) missing' });
        done();
      });
   });
});
