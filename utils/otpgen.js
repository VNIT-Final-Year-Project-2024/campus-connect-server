const otpGenerator = require('otp-generator');
const { generateToken } = require('./tokengen');
const { sendMail } = require('./aws-mailer');
const { store, retrieve } = require('./nodecache');

// function to generate OTP and token for a given request
generateOtp = (req, res, type) => {
    var obj = req.body; 
    var email;

    const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    console.log(`OTP: ${otp} for User: ${req.body.name}`);

    // TODO: this logic needs to be better
    if(type === 'student') {
        email = obj.emailPrefix + '@students.vnit.ac.in';
    }
    else if(type === 'faculty'){
        email = obj.emailPrefix + '@' + obj.dept + '.vnit.ac.in';
    } else {
        res.status(500).error('Incorrect type');
        return;
    }

    // send email to user's mail address
    sendMail(otp, email);
    obj.otp = otp;

    // generate token to use as key for storing user object in node-cache
    const token = generateToken(obj);
    store(token, req.body);

    // send the token as the response
    res.send({'token': `${token}`});
    return;
}

// fucntion to retrieve user details for token from request and check OTP
checkOtp = (req, res) => {
    var token = req.body.token;
    var otp = req.body.otp;
    try {
        // retrieve user object from node-cache using its token
        user = retrieve(token);
        if(user) {
            if (otp == user.otp) {
                return user;                            // successful login 
            } else {
                res.json({ status: 'incorrect' });      // incorrect OTP
                return;
            }
        } else {
            res.json({ status: 'timeout' });            // OTP timeout
            return;
        }
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
        return;
    }
}

// Export the main function for external use
module.exports = {
    generateOtp, checkOtp
};