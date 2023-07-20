const jwt = require("jsonwebtoken");
const createError = require("http-errors");

module.exports = async (req, res, next) => {
  try {
    //DONE Get the jwtToken from the header, or the body, or the query-string
    let jwtToken = req.get("Authorization" || req.body.jwt || req.query.jwt);

    //DONE check that they have sent it to me
    if (!jwtToken) {
      const error = createError(401, "no token provided");
      next(error);
      return;
    }

    console.log("existe token");
    //DONE Check that the token is valid
    const payload = jwt.verify(jwtToken, process.env.JWT_SECRET);
    console.log("token verificado");
    req.apiLoggedUser = payload._id;

    next();
  } catch (error) {
    if (error.message === "invalid signature") {
      next(createError(401, "invalid token"));
      return;
    } else if (error.message === "jwt expired") {
      next(createError(401, "jwt expired"));
      return;
    }
    next(error);
  }
};
