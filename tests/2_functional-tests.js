const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

const isoDateRegExp = /^\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}.\d{3}Z$/;
const testIssues = [
  { issue_title: 'xyz1', issue_text: 'xyz text 1', created_by: 'xyz-user-1' },
  { issue_title: 'xyz2', issue_text: 'xyz text 2', created_by: 'xyz-user-2', status_text: 'closed' },
  { issue_title: 'xyz3', issue_text: 'xyz text 3', created_by: 'xyz-user-3', status_text: 'closed' },
];
const project2 = 'test-project-xyz';
let testIssuesInDB;

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

  test('View issues on a project', async function() {
    for (const issue of testIssues) {
      await new Promise((resolve, reject) => {
        chai
          .request(server)
          .post(`/api/issues/${project2}`)
          .send({ ...issue })
          .end((err, res) => {
            if (err) reject(err);
            else resolve();
          });
      });
    }

    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .get(`/api/issues/${project2}`)
        .end((err, res) => {
          assert.isArray(res.body);
          assert.equal(res.body.length, testIssues.length);
          testIssues.forEach((issue, index) => {
            assertAllFieldsMatchObj(res.body[index], issue);
          });
          testIssuesInDB = res.body;
          resolve();
        });
    });
  });

  test('View issues on a project with one filter', async function() {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .get(`/api/issues/${project2}?open=false`)
        .end((err, res) => {
          assert.isArray(res.body);
          const closedIssues = testIssues.filter(issue => issue.status_text === 'closed');
          assert.equal(res.body.length, closedIssues.length);
          closedIssues.forEach((issue, index) => {
            assert.isObject(res.body[index]);
            assertAllFieldsMatchObj(res.body[index], issue);
          });
          resolve();
        });
    });
  });

  test('View issues on a project with multiple filters', async function() {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .get(`/api/issues/${project2}?open=false&created_by=xyz-user-3`)
        .end((err, res) => {
          assert.isArray(res.body);
          const selectedIssues = testIssues.filter(issue => issue.status_text === 'closed' && issue.created_by === 'xyz-user-3');
          assert.equal(res.body.length, selectedIssues.length);
          selectedIssues.forEach((issue, index) => {
            assert.isObject(res.body[index]);
            assertAllFieldsMatchObj(res.body[index], issue);
          });
          resolve();
        });
    });
  });

  test('Update one field on an issue', async function () {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .put(`/api/issues/${project2}`)
        .send({
          _id: testIssuesInDB[0]._id,
          status_text: 'closed',
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, {
            result: 'successfully updated',
            _id: testIssuesInDB[0]._id,
          });
          resolve();
        });
    });
  });

  test('Update multiple fields on an issue', async function () {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .put(`/api/issues/${project2}`)
        .send({
          _id: testIssuesInDB[0]._id,
          status_text: 'open',
          assigned_to: 'some-other-user',
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, {
            result: 'successfully updated',
            _id: testIssuesInDB[0]._id,
          });
          resolve();
        });
    });
  });

  test('Update an issue with missing _id', async function () {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .put(`/api/issues/${project2}`)
        .send({ status_text: 'open' })
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.deepEqual(res.body, {
            error: 'missing _id',
          });
          resolve();
        });
    });
  });

  test('Update an issue with no fields to update', async function () {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .put(`/api/issues/${project2}`)
        .send({ _id: testIssuesInDB[0]._id })
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.deepEqual(res.body, {
            error: 'no update field(s) sent',
            _id: testIssuesInDB[0]._id,
          });
          resolve();
        });
    });
  });

  test('Update an issue with an invalid _id', async function () {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .put(`/api/issues/${project2}`)
        .send({
          _id: 'some-invalid-id',
          status_text: 'closed',
        })
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.deepEqual(res.body, {
            error: 'could not update',
            _id: 'some-invalid-id',
          });
          resolve();
        });
    });
  });

  test('Delete an issue', async function () {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .delete(`/api/issues/${project2}`)
        .send({
          _id: testIssuesInDB[0]._id,
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, {
            result: 'successfully deleted',
            _id: testIssuesInDB[0]._id,
          });
          resolve();
        });
    });
  });

  test('Delete an issue with an invalid _id', async function () {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .delete(`/api/issues/${project2}`)
        .send({
          _id: 'some-invalid-id',
        })
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.deepEqual(res.body, {
            error: 'could not delete',
            _id: 'some-invalid-id',
          });
          resolve();
        });
    });
  });

    test('Delete an issue with missing _id', async function () {
    await new Promise((resolve, reject) => {
      chai
        .request(server)
        .delete(`/api/issues/${project2}`)
        .send({ })
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.deepEqual(res.body, {
            error: 'missing _id',
          });
          resolve();
        });
    });
  });
});
