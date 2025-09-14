const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

const BHUVAN_TOKEN = "4dd6a5461674d6d319c0ac4deddf6f64d90a3b83";
const WEATHER_API_KEY = "61d2f46e6ee7487094643745251409"; 

app.get("/get-lulc", async (req, res) => {
  try {
    const { coords } = req.query;

    if (!coords) {
      return res.status(400).json({
        error: "Missing 'coords' query parameter",
      });
    }

    let coordArray = coords.split(",");

    if (coordArray.length < 3) {
      return res.status(400).json({
        error: "At least 3 coordinates are required to form a polygon",
      });
    }

    // Coord for the satelite input polygon
    if (coordArray[0] !== coordArray[coordArray.length - 1]) {
      coordArray.push(coordArray[0]);
    }

    const geom = `POLYGON((${coordArray.join(",")}))`;

    // Extract first coordinate for SoilGrids and WeatherAPI
    const firstCoord = coordArray[0].split(" ");
    const lon = parseFloat(firstCoord[0]);
    const lat = parseFloat(firstCoord[1]);

    // URLs
    const lulcUrl = "https://bhuvan-app1.nrsc.gov.in/api/lulc/curl_aoi.php";
    const soilUrl = "https://rest.isric.org/soilgrids/v2.0/properties/query";
    const weatherUrl = "https://api.weatherapi.com/v1/current.json";

    // Parallel API requests
    const [lulcResponse, soilResponse, weatherResponse] = await Promise.all([
      axios.get(lulcUrl, {
        params: {
          geom: geom,
          token: BHUVAN_TOKEN,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
      axios.get(soilUrl, {
        params: {
          lon: lon,
          lat: lat,
          property: ["nitrogen", "phh2o"],
          depth: ["0-5cm", "5-15cm", "15-30cm"],
          value: ["mean", "uncertainty"],
        },
        headers: {
          accept: "application/json",
        },
      }),
      axios.get(weatherUrl, {
        params: {
          key: WEATHER_API_KEY,
          q: `${lat},${lon}`,
        },
        headers: {
          accept: "application/json",
        },
      }),
    ]);

    // Combine the results
    const combined = {
      location: {
        lat: lat,
        lon: lon,
      },
      land: lulcResponse.data,
      soil: soilResponse.data,
      weather: weatherResponse.data,
    };

    res.json(combined);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


