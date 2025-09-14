const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

// API keys
const BHUVAN_TOKEN = "4dd6a5461674d6d319c0ac4deddf6f64d90a3b83";
const WEATHER_API_KEY = "61d2f46e6ee7487094643745251409"; // Your WeatherAPI key

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

    // Ensure the polygon is closed by appending the first coordinate if needed
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

/*const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

// Your Bhuvan API token
const TOKEN = "d7f4bd438b370279d87c1bd8e29d468117c4c4ce";

// Route to get LULC and SoilGrids with dynamic coordinates
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

    // Ensure the polygon is closed by appending the first coordinate if needed
    if (coordArray[0] !== coordArray[coordArray.length - 1]) {
      coordArray.push(coordArray[0]);
    }

    const geom = `POLYGON((${coordArray.join(",")}))`;

    // Extract first coordinate for SoilGrids API
    const firstCoord = coordArray[0].split(" ");
    const lon = parseFloat(firstCoord[0]);
    const lat = parseFloat(firstCoord[1]);

    // Bhuvan API request
    const lulcUrl = "https://bhuvan-app1.nrsc.gov.in/api/lulc/curl_aoi.php";

    // SoilGrids API request
    const soilUrl = "https://rest.isric.org/soilgrids/v2.0/properties/query";
    const weatherapi = "61d2f46e6ee7487094643745251409";
    

    const [lulcResponse, soilResponse] = await Promise.all([
      axios.get(lulcUrl, {
        params: {
          geom: geom,
          token: TOKEN,
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
    ]);

    const combined = {
      location: {
        lat: lat,
        lon: lon,
      },
      lulc: lulcResponse.data,
      soil: soilResponse.data,
    };

    res.json(combined);
  } catch (error) {
    console.error(error.message);
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

//http://localhost:3000/get-lulc?coords=79.1300%2010.7800,79.1300%2010.7900,79.1500%2010.7900,79.1500%2010.7800
*/
