const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  console.log('IN CREATESESSION');
  console.log(req.cookies);
  if (Object.keys(req.cookies).length === 0) {
    return models.Sessions.create()
      .then(result => {
        console.log(result);
      });
  }
  next();
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

