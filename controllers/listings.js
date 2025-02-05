const Listing = require("../models/listing.js");
const axios = require("axios");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render(
    "listings/index.ejs",
    { allListings },
    { success: req.flash("success"), error: req.flash("error") }
  );
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs", {
    success: req.flash("success"),
    error: req.flash("error"),
  });
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing Does Not Exist!");
    res.redirect("/listings");
  }
  res.render(
    "listings/show.ejs",
    { listing },
    { success: req.flash("success"), error: req.flash("error") }
  );
};

module.exports.createListing = async (req, res, next) => {
  try {
    let url = req.file.path;
    let filename = req.file.filename;
    let location = req.body.listing.location;

    if (!location) {
      req.flash("error", "Location is required!");
      return res.redirect("/listings"); // Redirect if location is missing
    }

    // Construct the Geocoding API request URL
    const geocodeUrl = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
      location
    )}&apikey=${process.env.MAP_API_KEY}`;

    // Make request to HERE Geocoding API
    const response = await axios.get(geocodeUrl);

    if (response.data.items.length > 0) {
      const position = response.data.items[0].position; // Get lat & lng

      // Create GeoJSON object
      const geoJSON = {
        type: "Point", // GeoJSON format
        coordinates: [position.lng, position.lat], // Longitude, Latitude
      };

      // Create a new listing
      const newListing = new Listing(req.body.listing);
      newListing.owner = req.user._id;
      newListing.image = { url, filename };
      newListing.geometry = geoJSON; // Store GeoJSON in the database

      // Save the listing
      let savedListing = await newListing.save();
      console.log("New Listing Created:", savedListing);

      req.flash("success", "New Listing Created!");
      res.redirect(`/listings/${savedListing._id}`); // Redirect after successful creation
    } else {
      req.flash("error", "Location not found! Try a different address.");
      return res.redirect("/listings/new");
    }
  } catch (error) {
    console.error("Geocoding API Error:", error.message);
    req.flash("error", "Failed to fetch location. Please try again.");
    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing Does Not Exist!");
    res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render(
    "listings/edit.ejs",
    { listing, originalImageUrl },
    { success: req.flash("success"), error: req.flash("error") }
  );
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.search = async (req, res) => {
  const location = req.query.location || ""; // get location from query param
  try {
    const allListings = await Listing.find({
      location: { $regex: location, $options: "i" }, // case-insensitive search
    });
    res.render(
      "listings/index.ejs",
      { allListings },
      { success: req.flash("success"), error: req.flash("error") }
    ); // Render listings page with filtered results
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch listings" });
  }
};
