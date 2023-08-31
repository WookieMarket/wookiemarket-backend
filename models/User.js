const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

userSchema.statics.findByUsername = function (username) {
  const query = User.findOne({ username: username });
  return query;
};

//DONE Define the static method to look up a user by their ID
userSchema.statics.findUserById = function (userId) {
  const query = User.findById(userId,{'password':0});
  return query;
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

/**
 * 
 * @param {*} data 
 * @returns 
 */
userSchema.statics.updateUserData = async function ( data,id) {
  try{
    let {username,email,password,newPassword} = data;
    let userByUsername = await this.findByUsername(username);
    let userByEmail = await this.findByEmail(email);
    let user = await this.findById(id);
    
    if(userByUsername  && user.username!=username){
      throw new Error('User name not available');
    }else if(userByEmail && user.email!=email){
      throw new Error('Email not available');
    }
    console.log('username:',data);
    if(username){
      user.username = username;
    }
    if(email){
      user.email = email;
    }
    if(newPassword && await user.comparePassword(password)){
    const hashedPassword = await this.hashPassword(newPassword);
    user.password = hashedPassword;
    }
    // }else{
    //   throw new Error('It is not possible to change the password');
    // }
    user.save();
    console.log('Usuario',user);
    return(user);
  }catch (error){
    console.error(error);
    throw new Error(error.message);
  }
}


//NOTE create model

const User = mongoose.model('User', userSchema);

module.exports = User;
