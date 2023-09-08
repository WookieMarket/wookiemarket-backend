const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create Schema Users
const userSchema = mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  resetpassword: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Advert' }],
  // favorites: [
  //   {
  //     advert: { type: mongoose.Schema.Types.ObjectId, ref: 'Advert' },
  //     isFavorite: { type: Boolean, default: false },
  //   },
  // ],
});

userSchema.statics.usersAll = function () {
  const query = User.find();
  console.log(query);
  return query;
};

userSchema.statics.hashPassword = function (rawPassword) {
  return bcrypt.hash(rawPassword, 7);
};

// Instance method
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

userSchema.statics.findByUsername = function (username) {
  const query = User.findOne({ username: username });
  return query;
};

/**
 * method to search for a user by his id
 *
 * @param {userId} userId
 */
userSchema.statics.findUserById = function (userId) {
  const query = User.findById(userId, { password: 0 });
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

/**
 *
 * @param {*} data
 * @returns
 */
userSchema.statics.updateUserData = async function (data, id) {
  try {
    let { username, email, password, newPassword } = data;
    let userByUsername = await this.findByUsername(username);
    let userByEmail = await this.findByEmail(email);
    let user = await this.findById(id);

    if (userByUsername && user.username != username) {
      throw new Error('User name not available');
    } else if (userByEmail && user.email != email) {
      throw new Error('Email not available');
    }
    console.log('username:', data);
    if (username) {
      user.username = username;
    }
    if (email) {
      user.email = email;
    }
    if (newPassword && (await user.comparePassword(password))) {
      const hashedPassword = await this.hashPassword(newPassword);
      user.password = hashedPassword;
    }
    // }else{
    //   throw new Error('It is not possible to change the password');
    // }
    user.save();
    return user;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
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
    console.error(error);
    throw new Error(error.message);
  }
};

/**
 * method that returns the favorite ads of a user
 *
 * @param {userId} userId
 */
userSchema.statics.favoriteAds = async function (userId) {
  try {
    // Find the user by their ID and get the array of favorite ad IDs
    const user = await User.findById(userId).populate('favorites');
    if (!user) {
      throw new Error('User not found');
    }

    const favoriteAdIds = user.favorites;
    // Extract the IDs of favorite ads from the array of favorite objects
    //const favoriteAdIds = user.favorites.map(favorite => favorite.advert);

    console.log('usuarioschema', favoriteAdIds);

    return favoriteAdIds;
  } catch (error) {
    throw error;
  }
};
// userSchema.statics.favoriteAds = async function (userId) {
//   try {
//     // Find the user by their ID and get the array of favorite ad IDs
//     const user = await User.findById(userId).populate('favorites.advert');
//     if (!user) {
//       throw new Error('User not found');
//     }

//     //const favoriteAdIds = user.favorites;
//     // Extract the IDs of favorite ads from the array of favorite objects
//     const favoriteAdIds = user.favorites.map(favorite => favorite.advert);

//     console.log('usuarioschema', favoriteAdIds);

//     return favoriteAdIds;
//   } catch (error) {
//     throw error;
//   }
// };

userSchema.statics.isFavorite = async function (userId) {
  try {
    // Find the user by their ID and get the array of favorite ad IDs
    const user = await User.findById(userId).populate('favorites.advert');
    if (!user) {
      throw new Error('User not found');
    }

    // Extract the favorite ad objects
    const favoriteAds = user.favorites;

    const favoriteAdIdsWithIsFavorite = favoriteAds.map(favorite => ({
      _id: favorite.advert._id, // ID del anuncio
      isFavorite: favorite.isFavorite, // Propiedad isFavorite
    }));

    return favoriteAdIdsWithIsFavorite;
  } catch (error) {
    throw error;
  }
};

//NOTE create model

const User = mongoose.model('User', userSchema);
module.exports = User;
