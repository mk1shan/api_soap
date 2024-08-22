const express = require('express');
const soap = require('soap');
const axios = require('axios');

const app = express();
const port = 3004;

// OpenWeatherMap API configuration
const API_KEY = '4a0abbc8b904c7ecd6a197e54823c7c2'; // Replace with your API key
const WEATHER_API_URL = 'http://api.openweathermap.org/data/2.5/weather';

// Define the SOAP service
const weatherService = {
  WeatherService: {
    WeatherPort: {
      getWeather: async function(args) {
        try {
          const city = args.city;
          if (!city) {
            throw new Error('City is required');
          }

          // Fetch data from OpenWeatherMap API
          const response = await axios.get(WEATHER_API_URL, {
            params: {
              q: city,
              appid: API_KEY,
              units: 'metric' // Temperature in Celsius
            }
          });

          // Return weather data in SOAP format
          return {
            temperature: response.data.main.temp,
            description: response.data.weather[0].description
          };
        } catch (error) {
          throw new Error('Error fetching weather data');
        }
      }
    }
  }
};

// Create the SOAP server
app.listen(port, () => {
  console.log(`SOAP server running at http://localhost:${port}`);
  
  const xml = `
    <definitions name="WeatherService"
                 targetNamespace="http://example.com/weather"
                 xmlns:tns="http://example.com/weather"
                 xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/"
                 xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/">

      <message name="getWeatherRequest">
        <part name="city" type="xsd:string"/>
      </message>

      <message name="getWeatherResponse">
        <part name="temperature" type="xsd:string"/>
        <part name="description" type="xsd:string"/>
      </message>

      <portType name="WeatherPortType">
        <operation name="getWeather">
          <input message="tns:getWeatherRequest"/>
          <output message="tns:getWeatherResponse"/>
        </operation>
      </portType>

      <binding name="WeatherBinding" type="tns:WeatherPortType">
        <soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/>
        <operation name="getWeather">
          <soap:operation soapAction="urn:getWeather"/>
          <input>
            <soap:body use="encoded" namespace="urn:weather" encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"/>
          </input>
          <output>
            <soap:body use="encoded" namespace="urn:weather" encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"/>
          </output>
        </operation>
      </binding>

      <service name="WeatherService">
        <port name="WeatherPort" binding="tns:WeatherBinding">
          <soap:address location="http://localhost:3002/soap"/>
        </port>
      </service>
    </definitions>
  `;

  soap.listen(app, '/soap', weatherService, xml);
});
