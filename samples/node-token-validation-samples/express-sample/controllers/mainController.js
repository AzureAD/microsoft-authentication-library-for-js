exports.getHomePage = (req, res, next) => {
  const isAuthenticated = req.session.isAuthenticated;
  res.render('home', { isAuthenticated: isAuthenticated });
}

exports.getIdPage = (req, res, next) => {
  const isAuthenticated = req.session.isAuthenticated;

  const claims = {
      name: req.session.account.idTokenClaims.name,
      preferred_username: req.session.account.idTokenClaims.preferred_username,
      oid: req.session.account.idTokenClaims.oid,
      sub: req.session.account.idTokenClaims.sub
  };

  res.render('id', {isAuthenticated: isAuthenticated, claims: claims});
}
