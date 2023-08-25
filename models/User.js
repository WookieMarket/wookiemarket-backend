const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//DONE Create Schema Users

const userSchema = mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  resetpassword: String,
});

//NOTE static method all users

userSchema.statics.usersAll = function () {
  const query = User.find();
  console.log(query);
  return query;
};

userSchema.statics.hashPassword = function (rawPassword) {
  return bcrypt.hash(rawPassword, 7);
};

//NOTE instance method

userSchema.methods.comparePassword = function (rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

/**
 * method to search for a user by his email
 *
 * @param {email} email
 */
userSchema.statics.findByEmail = function (email) {
  const query = User.findOne({ email: email });
  return query;
};

/**
 * method to search for a user by his id
 *
 * @param {userId} userId
 */
userSchema.statics.findUserById = function (userId) {
  const query = User.findById(userId);
  return query;
};

/**
 * generate a token with the user's id and put it in resetpassword
 *
 * @param {id} id
 */
userSchema.statics.generateToken = async function (id) {
  try {
    const user = await User.findById(id);

    if (user) {
      //NOTE We clear the resetpassword field before storing the new value
      user.resetpassword = '';

      //NOTE Here you generate the password recovery token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      user.resetpassword = token;
      await user.save();
    }
  } catch (error) {
    console.error('Error al generar el token:', error);
  }
};

/**
 * method that looks for ey deletes a user by his id
 *
 * @param {userId} userId
 */
userSchema.statics.deleteUser = async function (userId) {
  const deletedUser = await User.findByIdAndDelete(userId);
  try {
    if (deletedUser) {
      console.log('User Deleted:', deletedUser);
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

//NOTE create model

const User = mongoose.model('User', userSchema);

module.exports = User;
