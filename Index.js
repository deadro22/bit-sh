const express = require("express");
const app = express();
const mongoose = require("mongoose");
const joi = require("joi");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect(
  "mongodb://heroku_1v0fwf7j:20kfcaosjd90qkbi9mu868m55q@ds149676.mlab.com:49676/heroku_1v0fwf7j",
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
  () => {
    console.log("Connected to db");
  }
);

const urlShortnerSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  expires: { type: Date, required: true },
});

const shortUrls = mongoose.model("urls", urlShortnerSchema);

app.get("/", (req, res) => {
  res.render(__dirname + "/Pages/Home.ejs", { shortUrlPr: "" });
});

app.get("/:slug", async (req, res) => {
  const foundUrl = await shortUrls.findOne({ slug: req.params.slug });
  if (!foundUrl) return res.status(404).send("No url found with this slug");
  if (foundUrl.expires <= new Date())
    return res.status(403).send("Expired Url");
  res.redirect(foundUrl.url);
});

app.post("/", async (req, res) => {
  const validationSchema = joi.object({
    url: joi.string().uri().required(),
    slug: joi.string().required(),
  });
  const { error } = validationSchema.validate(req.body);
  if (error) return res.status(503).send(error.message);
  let expDate = new Date();
  expDate.setDate(expDate.getDate() + 30);
  const newUrl = new shortUrls({
    url: req.body.url,
    slug: req.body.slug,
    expires: expDate,
  });
  await newUrl.save();
  res.render(__dirname + "/Pages/Home.ejs", {
    shortUrlPr: newUrl.slug,
    url: req.headers.host,
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port 3000");
});
