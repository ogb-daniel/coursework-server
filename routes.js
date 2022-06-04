var express = require("express");
const { MongoClient } = require("mongodb");
const client = new MongoClient(dbURI);
var router = express.Router();

async function getAllLessons(client) {
  const lessons = await client.db("coursework").collection("lessons").find();
  const results = await lessons.toArray();
  return results;
}

module.exports = router;
