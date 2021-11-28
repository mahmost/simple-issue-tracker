'use strict';

const { ObjectId } = require('mongodb');

module.exports = function apiRoutes(app, issues) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res) {
      const project = req.params.project;
      const selector = { project };

      if (Object.keys(req.query).length) {
        Object.keys(req.query).forEach((field) => {
          let value;
          if (field === 'created_on' || field === 'updated_on') value = new Date(req.query[field])
          if (field === 'open') {
            value = ['0', 'false', 'off', 'no'].indexOf(req.query[field]) > -1 ? false : true;
          } else value = req.query[field];

          selector[field] = value;
        });
      }

      const data = await issues.find(selector);

      res.json(await data.toArray());
    })
    
    .post(async function (req, res){
      const project = req.params.project;
      const issue = req.body;

      if (!issue.issue_title || !issue.issue_text || !issue.created_by) return res.status(400).json({ error: 'required field(s) missing' });

      issue._id = (new ObjectId).toString();
      issue.created_on = (new Date).toISOString();
      issue.updated_on = issue.created_on;
      issue.open = issue.status_text !== 'closed';

      await issues.insertOne({ ...issue, project });

      if (!issue.assigned_to) issue.assigned_to = '';
      if (!issue.status_text) issue.status_text = '';

      res.json(issue);
    })
    
    .put(async function (req, res){
      const project = req.params.project;
      const data = { ...req.body };
      const _id = req.body._id;
      delete data._id;

      if (!_id) return res.status(400).json({ error: 'missing _id'});

      if (!await issues.findOne({ _id })) return res.status(400).json({ error: 'could not update', _id });

      if (!Object.keys(data).length) return res.status(400).json({ error: 'no update field(s) sent', _id });

      await issues.updateOne({ _id }, { $set: data });
      res.json({
        result: 'successfully updated',
        _id,
      });
    })
    
    .delete(function (req, res){
      const project = req.params.project;
      
    })
    
};
