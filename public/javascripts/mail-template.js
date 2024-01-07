// an email template that can be used with Nodemailer to send emails

const HTML_TEMPLATE = (otp) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Campus Connect App</title>
          <style>
            .container {
              width: 100%;
              height: 100%;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .email {
              width: 80%;
              margin: 0 auto;
              background-color: #fff;
              padding: 20px;
            }
            .email-header {
              background-color: #333;
              color: #fff;
              padding: 20px;
              text-align: center;
            }
            .email-body {
              padding: 20px;
            }
            .email-footer {
              background-color: #333;
              color: #fff;
              padding: 20px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email">
              <div class="email-header">
                <h1>Campus Connect Onbaording</h1>
              </div>
              <div class="email-body">
                <p>Greetings, here's your OTP to get onboarded!</p>
                <div style="text-align: center;"><h2 style="font-weight: bold;">${otp}</h2></div>
              </div>
              <div class="email-footer">
                <p>Made with ❤️ at VNIT</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
module.exports = {
    HTML_TEMPLATE
};