require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken); 
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const Analytics = require('analytics-node');
const analytics = new Analytics(process.env.SEGMENT_KEY);
const ABTesting = require('ab-testing');

// user profile
let user = {
    userId: 'ENTER USER ID',
    name: 'NAME',
    number: 'NUMBER',
    email: 'EMAIL'
}

// Twilio and Sendgrid info to be used for AB testing logic later
let twilio_info = {
    from: 'YOUR TWILIO NUMBER',
    body: `Reminder for ${user.name} your appointment is coming up tomorrow`,
    twiml: `<Response><Say>Reminder for ${user.name} your appointment is coming up tomorrow</Say></Response>`
}

const email_msg = {
    to: user.email, 
    from: 'YOUR SENDGRID EMAIL', 
    subject: 'Your Appointment is coming up',
    text: 'Your Appointment is coming up',
    html: `<strong>Your appointment is tomorrow, ${user.name}, let us know if you need to make a change.</strong>`,
  }

analytics.identify({
    userId: user.userId,
    traits: {
      name: user.name,
      email: user.email,
      phone: user.number
    }
});


var channelTest = ABTesting.createTest('channelTest', [{ name: 'SMS' }, { name: 'CALL' }, { name: 'EMAIL' }, { name: 'WHATSAPP' }]);

var channelTestVariation = channelTest.getGroup(user.userId);

console.log(channelTest.getName(), channelTestVariation)

// segment call to track experiment info
analytics.track({
    userId: user.userId,
    event: 'Experiment Viewed',
    properties: {
      experiment_name: channelTest.getName(),
      variation_name: channelTestVariation
    }
});

// AB test logic and Twilio calls for each channel
channelTest.test(channelTestVariation, [
	function () {
        console.log("sms")
		client.messages
        .create({
            body: twilio_info.body,
            from: twilio_info.from,
            to: user.number
        })
        .then(message => console.log(message.sid));
	},
	function () {
		// CALL code
        console.log('call')
        client.calls
        .create({
            twiml: twilio_info.twiml,
            from: twilio_info.from,
            to: user.number
        })
        .then(call => console.log(call.sid));
	},
    function () {
		// EMAIL code
        console.log('email')
        sgMail
        .send(email_msg)
        .then((response) => {
          console.log(response[0].statusCode)
          console.log(response[0].headers)
        })
        .catch((error) => {
          console.error(error)
        })
	},
	function () {
		// WHATSAPP code
        console.log('whatsapp')
        client.messages
        .create({
            body: twilio_info.body,
            from: 'whatsapp:+14155238886',
            to: `whatsapp:${user.number}`
        })
        .then(message => console.log(message.sid));
	}
], this);


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
