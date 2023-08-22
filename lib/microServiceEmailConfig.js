'use strict';

const { Requester } = require('cote');
const requester = new Requester({ name: 'email-requester' });
const { User } = require('../models');
const jwt = require('jsonwebtoken');

/**
 * Config to trigger welcome email when an user account is created
 *
 * @param {*} to
 * @returns a promise to send
 */
module.export = async function (to) {
  try {
    const user = await User.findOne({ email: to });

    if (!user) {
      throw new Error('user not found');
    }

    //NOTE We clear the resetpassword field before storing the new value
    user.resetpassword = '';

    //NOTE Here you generate the password recovery token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    //NOTE I delete the old token before re-saving the new one
    user.resetpassword = token;
    await user.save();

    //NOTE Send the message to the microservice to send the email
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
};
