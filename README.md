# Pollen Count

Ask Alexa for the pollen count at your (UK) location:

> Alexa, open the pollen count

> The pollen count at SE1 9GF is low

The skill will be available on the Alexa skill store soon.


## Development

### Serverless

The skill is hosted on AWS Lambda via [Serverless](https://serverless.com/framework/docs). Serverless environment settings should be configured in an `env.yml` file.


### Code structure

`handler.js` contains the application logic. The `handler()` function is Serverless' entry point into the skill.


### APIs

The skill requires access to the Alexa device's postcode ([see docs](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/device-address-api)).

The [postcodes.io](https://postcodes.io) API is then used to get the latitude and longitude for the given postcode.

Finally, the skill uses the [Social Pollen Count](https://socialpollencount.co.uk) API to get the pollen forecast.


## Contributing

Issues and PRs are very welcome!
