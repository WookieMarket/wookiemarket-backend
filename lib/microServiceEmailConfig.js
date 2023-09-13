const { User } = require('../models');
const cote = require('cote');
const jwt = require('jsonwebtoken');

const requester = new cote.Requester({ name: 'email-requester' });

/**
 *  This method sends an email that contains the user's own email and a token to change the password
 * @param {*} to
 * @returns
 */
async function microEmailService(to) {
  try {
    const user = await User.findByEmail(to);

    if (!user) {
      throw new Error('user not found');
    }

    // We clear the resetpassword field before storing the new value
    user.resetpassword = '';

    // Here you generate the password recovery token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // It drops old token before saving the new one
    user.resetpassword = token;
    await user.save();

    // Sends the message to the microservice to send the email
    const emailRequest = {
      type: 'send_email',
      to: to,
      from: process.env.EMAIL_SEND_GRID,
      templateId: process.env.TEMPLATE_ID_SEND_GRID,
      dynamic_template_data: {
        email: to,
        token: token,
      },
    };

    return new Promise(resolve => requester.send(emailRequest, resolve));
  } catch (error) {
    throw new Error('Error sending password recovery email.');
  }
}

/**
 *  This method sends an email
 * @param {*} to
 * @param {*} custom_message
 * @returns
 */
async function microEmailServiceBuy(adOwnerId, custom_message) {
  try {
    // search for the owner of the ad by the id to obtain their email
    const ownerArticle = await User.findByEmail(adOwnerId);

    if (!ownerArticle) {
      throw new Error('user not found');
    }

    const to = ownerArticle.email;

    // obtain the email of the user who is registered
    const userId = req.user.id;

    const registeredUser = await User.userId(userId);

    const userFrom = registeredUser.email;

    // Send email to the owner of the ad to buy it
    const emailRequest = {
      type: 'send_email',
      to: to,
      custom_message: custom_message,
      from: process.env.EMAIL_SEND_GRID,
      templateId: process.env.TEMPLATE_ID_SEND_GRID_BUY,
      dynamic_template_data: {
        email: custom_message,
        token: userFrom,
      },
    };

    return new Promise(resolve => requester.send(emailRequest, resolve));
  } catch (error) {
    throw new Error('Error sending email.');
  }
}

/**
 * This reset user password
 *
 * @param {*} email
 * @param {*} token
 * @param {*} newPassword
 * @returns message of password was succesfully reset or throws error if it fails
 */
async function resetPassword(email, token, newPassword) {
  try {
    //NOTE Search for the user in the database by their email

    const user = await User.findByEmail(email);
    console.log('usuario', user);

    // NOTE If the user is not found, return an error
    if (!user) {
      throw new Error('User not found');
    }

    // NOTE If the resetpassword token does not match, return an error
    if (user.resetpassword !== token) {
      console.log('usuario', user.resetpassword);
      throw new Error('Invalid recovery token');
    }

    //NOTE Encrypt the new password using the hashPassword function
    const hashedPassword = await User.hashPassword(newPassword);

    //NOTE Update the user's password with the new encrypted password
    user.password = hashedPassword;

    //NOTE Delete the recovery token after it has been used
    user.resetpassword = '';

    await user.save();

    //NOTE Reply with a success message
    return { message: 'Password changed successfully' };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function serviceOffline() {
  requester.close();
}

module.exports = {
  microEmailService,
  microEmailServiceBuy,
  resetPassword,
  serviceOffline,
};
