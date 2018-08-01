'use strict';

const jwt = require('jsonwebtoken');
const fs = require('fs');

// Create token
const jwtSignOption = {
  algorithm: 'RS512',
  expiresIn: '1d',
  audience: 'wday-cc-refapp',
  issuer: 'wday-cc',
  subject: 'wday-cc',
  keyid: 'wday-cc-kid-1',
};
const key = fs.readFileSync('./key.pem');

module.exports = function(callback) {
  jwt.sign({}, key, jwtSignOption, function(err, token) {
    if (err) {
      console.error(err);
    } else {
      return callback(token);
    }
  });
};

