'use strict';

const { ObjectId } = require('mongodb');

module.exports = function apiRoutes(app, issues) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      const project = req.params.project;
    })
    
    .post(async function (req, res){
      const project = req.params.project;
      const issue = req.body;

      if (!issue.issue_title || !issue.issue_text || !issue.created_by) return res.status(400).json({ error: 'required field(s) missing' });

      issue._id = (new ObjectId).toString();
      issue.created_on = (new Date).toISOString();
      issue.updated_on = issue.created_on;
      issue.open = issue.status_text !== 'closed';

      issues.insertOne({ ...issue });

      if (!issue.assigned_to) issue.assigned_to = '';
      if (!issue.status_text) issue.status_text = '';

      res.json(issue);
    })
    
    .put(function (req, res){
      const project = req.params.project;
      
    })
    
    .delete(function (req, res){
      const project = req.params.project;
      
    })
    
};
