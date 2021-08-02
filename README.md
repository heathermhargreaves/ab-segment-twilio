# ab-segment-twilio
This is a demo to show how to AB test different Twilio channels and track the experiment viewed events in Segment

## Requirements
- Node
- Segment account
- Twilio account with access to Programmable SMS, Programmable Voice, and a phone number
- Sendgrid account
- Ngrok

## Getting Started
1. Fork and clone this repo
2. Initialize Node app with `npm init`
3. Install the following libraries using this command: `npm install --save express body-parser ab-testing twilio @sendgrid/mail analytics-node dotenv`
4. Add a `.env` file in the root of this directory.
5. In the `.env`, copy and paste the following code and add your keys for Twilio, Segment, and Sendgrid, as well your phone number and email where you want to receive notifications from the demo:
```
PORT=3000
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=
SEGMENT_KEY=
NGROK_URL=
PHONE_NUMBER=
EMAIL=
```
Hold off on adding the `NGROK_URL` value until you have ngrok running.
6. On line 15 in `index.js` you will see the `user` variable, update this your name and a random user id to receive a message.
7. On line 23 in `index.js` update `twilio_info.from` to your Twilio number.
8. On line 31 in `index.js` update the `email_msg.from` to your Sendgrid email.
9. Start ngrok by navigating to where ngrok is locally and running the command `./ngrok http 3000`. Copy the URL given to you by ngrok and in `.env` update the `NGROK_URL` variable.
10. Make sure your local updates are saved and run `node index.js` to start your app.
