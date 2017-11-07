const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length === 0) {
    return models.Sessions.create()
      .then(result => {
        return models.Sessions.get({ id: result.insertId });
      })
      .then(result => {
        res.cookies['shortlyid'] = {value: result.hash};
        req.session = result;
        next();
      });
  } else {
    return models.Sessions.get({ hash: req.cookies.shortlyid })
      .then(result => {
        req.session = result;
        next();
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

