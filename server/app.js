const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => { cookieParser(req, res, next); });
app.use((req, res, next) => { Auth.createSession(req, res, next); });

app.get('/', (req, res) => {
  models.Sessions.get({hash: req.session.hash})
  .then(info => {
    if (models.Sessions.isLoggedIn(info)) {
      res.render('index');
    } else {
      res.redirect(303, '/login');
    }
  });
});

app.get('/create', (req, res) => {
  models.Sessions.get({hash: req.session.hash})
  .then(info => {
    if (models.Sessions.isLoggedIn(info)) {
      res.render('index');
    } else {
      res.redirect(303, '/login');
    }
  });
});

app.get('/links', 
(req, res, next) => {
  models.Sessions.get({hash: req.session.hash})
  .then(info => {
    if (models.Sessions.isLoggedIn(info)) {
      models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
    } else {
      res.redirect(303, '/login');
    }
  });



});

app.post('/links', 
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

app.post('/signup', (req, res, next) => {
  return models.Users.get({ username: req.body.username })
    .then(result => {
      if (result) {
        res.redirect(303, '/signup');
      } else {
        return models.Users.create(req.body)
          .then(result => {
            return models.Users.get({ username: req.body.username });
          })
          .then(user => {
            return models.Sessions.update({ hash: req.session.hash }, { userId: user.id});
          })
          .then(result => {
            res.redirect(303, '/');
          });
      }
    });
});

app.post('/login', (req, res, next) => {
  return models.Users.get({ username: req.body.username })
    .then (result => {
      if (result) {
        if (models.Users.compare(req.body.password, result.password, result.salt)) {
          //result.body.username for ID 
          //Add ID to current session which should be on the req or maybe the res
          
          res.redirect(303, '/');
        } else {
          res.redirect(303, '/login');
        }
      } else {
        res.redirect(303, '/login');
      }
    });
});


/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/logout', (req, res, next) => {
  return models.Sessions.delete({ hash: req.session.hash})
  .then(stuff => {
    req.session.hash = {};
    next();
  });
});


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
