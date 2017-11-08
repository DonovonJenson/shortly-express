const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length === 0) {
    newSessionMaker(req, res, next);
  } else {
    return models.Sessions.get({ hash: req.cookies.shortlyid })
      .then(result => {
        if (result === undefined) {
          newSessionMaker(req, res, next);
        } else {
          req.session = result;
          next();
        }
      });
  }
};

var newSessionMaker = function(req, res, next) {
  return models.Sessions.create()
    .then(result => {
      return models.Sessions.get({ id: result.insertId });
    })
    .then(result => {
      res.cookie('shortlyid', result.hash);
      req.session = result;
      next();
    });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

