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

//DONE Define the static method to search for users by their email
userSchema.statics.findByEmail = function (email) {
  const query = User.findOne({ email: email });
  return query;
};

//DONE Define the static method to look up a user by their ID
userSchema.statics.findUserById = function (userId) {
  const query = User.findById(userId);
  return query;
};

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

userSchema.statics.deleteUser = async function (userId) {
  const deletedUser = await User.findByIdAndDelete(userId);
  try {
    if (deletedUser) {
      console.log('Usuario eliminado:', deletedUser);
    } else {
      console.log('Usuario no encontrado.');
    }
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
  }
};

/**
 * This reset user password
 *
 * @param {*} email
 * @param {*} token
 * @param {*} newPassword
 * @returns message of password was succesfully reset or throws error if it fails
 */
userSchema.statics.resetPassword = async function (email, token, newPassword) {
  try {
    // Search for the user in the database by their email
    const user = await this.findOne({ email: email, resetpassword: token });

    //NOTE If the user is not found or the token does not match, return an error
    if (!user) {
      throw new Error('Invalid recovery token or user not found');
    }

    //NOTE Encrypt the new password using the hashPassword function
    const hashedPassword = await this.hashPassword(newPassword);

    //NOTE Update the user's password with the new encrypted password
    user.password = hashedPassword;

    //NOTE Delete the recovery token after it has been used
    user.resetpassword = '';

    await user.save();

    //NOTE Reply with a success message
    return { message: 'Password changed successfully' };
  } catch (error) {
    console.error(error);
    throw new Error('Failed to change password.');
  }
};

//NOTE create model

const User = mongoose.model('User', userSchema);

module.exports = User;
