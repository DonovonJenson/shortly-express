const parseCookies = (req, res, next) => {
  var cookieObj = {};
  if (req.headers.cookie) {
    var cookieList = req.headers.cookie.split('; ');
    for (var i = 0; i < cookieList.length; i++) {
      var cookieArray = cookieList[i].split('=');
      cookieObj[cookieArray[0]] = cookieArray[1];
    }
  }
  req.cookies = cookieObj;
  next();
};

module.exports = parseCookies;