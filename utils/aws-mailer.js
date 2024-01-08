const AWS = require('aws-sdk');
require('dotenv').config();
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

const SES_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_SES_REGION,
};

AWS.config.update(SES_CONFIG);

// AWS.config.update({ region: 'ap-south-1' });
// AWS.config.update({ logger: console });

sendMail = (otp, email) => {
  let params = {
      Destination: {
      /* required */
      ToAddresses: [email]
      },
      Message: {
      /* required */
      Body: {
          /* required */
          Html: {
          Charset: "UTF-8",
          Data: `<h3>Campus Connect App</h3><br/>
                  <p>It's great to have you onboard! <br/>
                  Please enter provided code into the signup page and get started.</p>
                  <p>Your OTP is:</p>
                  <h2>${otp}</h2>
                  <p>Regards,<br/>
                  Campus Connect App Team</p>`
          },
          Text: {
          Charset: "UTF-8",
          Data: `Hi! Your Login OTP is ${otp}`
          }
      },
      Subject: {
          Charset: 'UTF-8',
          Data: `Campus Connect App: Verify your email ID`
      }
      },
      Source: process.env.APP_MAIL_ID,
      /* required */
      ReplyToAddresses: [process.env.APP_MAIL_ID],
  };

  const accessKeyId = AWS.config.credentials.accessKeyId;
  // console.log('Mail sent using access key: ',accessKeyId);

  var sendPromise = new AWS.SES()
  .sendEmail(params)
  .promise();

  sendPromise.then(
    function (data) {
      console.log(data.MessageId);
    })
  .catch(
    function (err) {
      console.error(err, err.stack);
    });

  return;    
}

module.exports = {
    sendMail
}