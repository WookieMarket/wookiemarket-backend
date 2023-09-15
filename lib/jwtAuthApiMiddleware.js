const jwt = require('jsonwebtoken');
const createError = require('http-errors');

module.exports = async (req, res, next) => {
  try {
    // Get the jwtToken from the header, or the body, or the query-string
    let jwtToken = req.get('Authorization' || req.body.jwt || req.query.jwt);

    // Check that they have sent it to me
    if (!jwtToken) {
      const error = createError(401, 'no token provided');
      next(error);
      return;
    }

    // Removes Bearer from the token
    jwtToken = jwtToken.replace('Bearer ', '');

    // Check that the token is valid
    const payload = jwt.verify(jwtToken, process.env.JWT_SECRET);

    req.user = { id: payload._id };

    next();
  } catch (error) {
    if (error.message === 'invalid signature') {
      next(createError(401, 'invalid token'));
      return;
    } else if (error.message === 'jwt expired') {
      next(createError(401, 'jwt expired'));
      return;
    }
    next(error);
  }
};
