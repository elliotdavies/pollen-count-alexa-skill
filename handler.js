'use strict';

const fetch = require('node-fetch');

/**
 * Entry point
 */
module.exports.handler = (event, context, callback) => {
  const { request } = event;
  console.log(JSON.stringify(request));

  const reply = sendResponse(callback);

  const intent = request.type === 'LaunchRequest'
    ? 'Launch'
    : request.intent.name;

  switch (intent) {
    // When the skill is opened without a command
    case 'Launch':
    // When asked for the pollen count
    case 'GetPollenCount':
      console.log('Trying to get a postcode...');
      parseDetails(event)
        .then(fetchPostcode)
        .then(fetchLatLng)
        .then(fetchPollenForecast)
        .then(({ postcode, count }) => {
          const postcodeSsml = `<say-as interpret-as="spell-out">${postcode.replace(' ', '')}</say-as>`;
          reply({
            speech: `The pollen count for today at ${postcodeSsml} is <break strength="weak" /> ${count}.`,
            card: {
              type: 'Simple',
              title: 'Pollen count',
              content: `The pollen count for today at ${postcode} is ${count}.`,
            },
          });
        })
        .catch(err => {
          console.log('Error:', err);
          reply(requestPostcodeResponse);
        });
      break;
    // When asked for help
    case 'AMAZON.HelpIntent':
      reply(helpResponse);
      break;
    // When asked to stop or cancel
    case 'AMAZON.StopIntent':
    case 'AMAZON.CancelIntent':
      reply(stopResponse);
      break;
  }
};

/**
 * Try to extract the device's various details
 */
const parseDetails = event =>
  new Promise((resolve, reject) => {
    try {
      const deviceId = event.context.System.device.deviceId;
      const consentToken = event.context.System.user.permissions.consentToken;
      const apiEndpoint = event.context.System.apiEndpoint;

      if (!deviceId || !consentToken || !apiEndpoint)
        return reject(`Failed to get identifiers`);

      // console.log('Got identifiers:', deviceId, consentToken, apiEndpoint);
      resolve({ deviceId, consentToken, apiEndpoint });
    } catch (e) {
      return reject(e);
    }
  });

/**
 * Fetch the device's postcode
 */
const fetchPostcode = ({ deviceId, consentToken, apiEndpoint }) =>
  fetch(
    `${apiEndpoint}/v1/devices/${deviceId}/settings/address/countryAndPostalCode`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${consentToken}`,
      },
    }
  )
    .then(res => res.json())
    .then(({ countryCode, postalCode }) => postalCode);

/**
 * Transform the postcode to a latitude and longitude
 */
const fetchLatLng = postcode =>
  fetch(`https://api.postcodes.io/postcodes/${postcode}`)
    .then(res => res.json())
    .then(json => {
      console.log('Got json:', json);
      return {
        postcode,
        lat: json.result.latitude,
        lng: json.result.longitude,
      };
    });

/**
 * Use the latitude and longitude to get the pollen forecast
 */
const fetchPollenForecast = ({ postcode, lat, lng }) =>
  fetch(`http://socialpollencount.co.uk/api/forecast?location=[${lat},${lng}]`)
    .then(res => res.json())
    .then(({ date, forecast }) => {
      // We get seven days of data back, so find today's
      const now = new Date(date).getDate();
      const todayForecast = forecast
        .map(f => ({
          date: new Date(f.date).getDate(),
          count: f.pollen_count,
        }))
        .filter(f => f.date === now)[0];

      const { count } = todayForecast;

      return { postcode, count };
    });

/**
 * Build a response that asks the user to grant access to their postcode
 */
const requestPostcodeResponse = {
  speech: `Please visit the Alexa app to grant access to your postcode`,
  card: {
    type: 'AskForPermissionsConsent',
    permissions: ['read::alexa:device:all:address:country_and_postal_code'],
  },
};

/**
 * Build a help response
 */
const helpResponse = {
  speech: `Try asking for the pollen count near you`,
};

/**
 * Build a stop / cancel response
 */
const stopResponse = {
  speech: `Goodbye!`,
};

/**
 * Reply to Alexa
 */
const sendResponse = callback => ({ speech, card = null }) => {
  const defaultCard = {
    type: 'Simple',
    title: 'Pollen count',
    content: speech,
  };

  console.log('Card:', card);
  console.log('Using:', card || defaultCard);

  callback(null, {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speech}</speak>`,
      },
      card: card || defaultCard,
      shouldEndSession: true,
    },
  });
};
