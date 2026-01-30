import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authTokenSid = process.env.TWILIO_AUTH_TOKEN_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID!;

export async function sendSms(to: string, message: string) {
	if (process.env.TWILIO_ACCOUNT_SID !== "no-send") {
		const client = twilio(authTokenSid, authToken, { accountSid: accountSid });

		client.messages
			.create({
				body: message,
				to,
				messagingServiceSid,
			})
			.then((res) => {
				console.log("message", res.sid);
			})
			.catch((error) => {
				console.error(`error sending sms message: ${error.toString()}`);
			});
	}
}
