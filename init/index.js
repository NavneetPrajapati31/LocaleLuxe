const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const { default: axios } = require("axios");

const MONGO_URL = "mongodb://127.0.0.1:27017/LocaleLuxe";

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const getCoordinatesFromHere = async (location) => {
  try {
    const response = await axios.get(
      `https://geocode.search.hereapi.com/v1/geocode?q=${location}&apiKey=${process.env.MAP_API_KEY}`
    );
    if (response.data.items.length > 0) {
      const { lat, lng } = response.data.items[0].position;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error("Error in getCoordinatesFromHere:", error);
    return null;
  }
};

const initDB = async () => {
  await Listing.deleteMany({});

  // Use Promise.all to ensure all asynchronous operations are completed
  const listingsWithCoordinates = await Promise.all(
    initData.data.map((obj) => {
      // Ensure coordinates are fetched correctly
      // let Coordinates = await getCoordinatesFromHere(obj.location);
      // if (!Coordinates) {
      //   console.warn(
      //     "Skipping listing due to missing coordinates:",
      //     obj.location
      //   );
      //   return null; // Skip if coordinates are not found
      // }

      // Add geometry and ensure type is set to "Point"
      return {
        ...obj,
        owner: "679bf3c5162b4e0928b426b3", // Use a default owner if necessary
        geometry: {
          type: "Point", // Ensure this is set to "Point"
          // coordinates: [Coordinates.lng, Coordinates.lat], // Ensure coordinates are set
          coordinates: [77.1025, 28.7041],
        },
      };
    })
  );

  // Filter out null entries that failed to fetch coordinates
  const validListings = listingsWithCoordinates.filter((obj) => obj !== null);

  // Insert valid listings into the database
  await Listing.insertMany(validListings);
  console.log("Data was initialized successfully");
};

initDB();
