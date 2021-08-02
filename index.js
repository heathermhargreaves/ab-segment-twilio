require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require('twilio')(accountSid, authToken); 
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const Analytics = require('analytics-node');
const analytics = new Analytics(process.env.SEGMENT_KEY);
const ABTesting = require('ab-testing');


// user profile
let user = {
    userId: '12',
    name: 'Stacy',
    number: process.env.PHONE_NUMBER,
    email: process.env.EMAIL
}

// Twilio and Sendgrid info to be used for AB testing logic later
let twilio_info = {
    from: '+15102966273',
    body: `Reminder for ${user.name} your appointment is coming up tomorrow`,
    twiml: `<Response><Say>Reminder for ${user.name} your appointment is coming up tomorrow</Say></Response>`
}

const email_msg = {
    to: user.email, 
    from: 'help@meeting-icebreaker.com', 
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

// Creating AB test name and setting variation names
var channelTest = ABTesting.createTest('channelTest', [{ name: 'SMS' }, { name: 'CALL' }, { name: 'EMAIL' } ]);

var channelTestVariation = channelTest.getGroup(user.userId);

console.log(channelTest.getName(), channelTestVariation)

// Segment call to track experiment info
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
		twilio.messages
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
        twilio.calls
        .create({
            twiml: twilio_info.twiml,
            from: twilio_info.from,
            to: user.number,
            method: 'GET',
            statusCallback: `${process.env.NGROK_URL}/call`,
            statusCallbackEvent: ['answered'],
            statusCallbackMethod: 'POST'
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
        })
        .catch((error) => {
          console.error(error)
        })
 	}
 ], this);

// endpoints for webhooks to capture responses and answers
app.post('/sms', (req, res) => {
    
    analytics.track({
        userId: user.userId,
        event: 'Responded to SMS',
        properties: {
          user_response: req.body.Body,
          experiment_name: channelTest.getName(),
          variation_name: channelTestVariation
        }
    });

    res.sendStatus(200);

  });

  app.post('/call', (req, res) => {
    
    analytics.track({
        userId: user.userId,
        event: 'Answered Call',
        properties: {
          experiment_name: channelTest.getName(),
          variation_name: channelTestVariation
        }
    });
  
  });

  app.post('/email', (req, res) => {
    
    analytics.track({
        userId: user.userId,
        event: 'Opened Email',
        properties: {
          experiment_name: channelTest.getName(),
          variation_name: channelTestVariation
        }
    });
    
  });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
