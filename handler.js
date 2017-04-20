'use strict';

module.exports.handler = (event, context, callback) => {
  const { request } = event;

  console.log(JSON.stringify(request));

  const { System } = event.context;
  const deviceId = System.device.deviceId;
  const consentToken = System.user.permissions.consentToken;
  const apiEndpoint = System.apiEndpoint;

  console.log(deviceId, consentToken, apiEndpoint);

  const reply = sendResponse(callback);

  const intent = request.type === 'LaunchRequest'
    ? 'Launch'
    : request.intent.name;

  switch (intent) {
    // When the skill is opened without a command
    case 'Launch':
      reply(helpResponse());
      break;
    // When asked for help
    case 'AMAZON.HelpIntent':
      reply(helpResponse());
      break;
    // When asked to stop or cancel
    case 'AMAZON.StopIntent':
    case 'AMAZON.CancelIntent':
      reply(stopResponse());
      break;
  }
};

// Explain available commands
const helpResponse = () => {
  return `Try asking for the pollen count near you`;
};

// Stop / cancel
const stopResponse = () => {
  return `Goodbye!`;
};

// Reply to Alexa
const sendResponse = callback => speech => {
  callback(null, {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: speech,
      },
      card: {
        type: 'Simple',
        title: 'Pollen count',
        content: speech,
      },
      shouldEndSession: true,
    },
  });
};
