const { User } = require('../models');
const jwt = require('jsonwebtoken');

//DONE login post from API
class LoginControllerApi {
  async authApi(req, res, next) {
    try {
      const { username, password } = req.body;

      //NOTE Search the user in the DB
      const user = await User.findOne({ username: username });

      //NOTE If it does not exist or the password does not match --> error
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'invalid credentials' });
      }

      //NOTE If it exists and the password matches
      const tokenApi = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '2d',
      });

      res.json({ jwt: tokenApi });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LoginControllerApi;
