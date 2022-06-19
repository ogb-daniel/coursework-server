const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
const dbConfig = require("./config/db");
const main = async () => {
  const app = express();
  const corsOptions = {
    origin: "*",
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
  };
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors(corsOptions));
  const publicPath = path.resolve(__dirname, "public");
  app.use(express.static(publicPath));
  app.use(morgan("combined"));

  const client = new MongoClient(dbConfig.url);
  const database = dbConfig.database;
  const lessonsCollection = dbConfig.lessonsCollection;
  const ordersCollection = dbConfig.ordersCollection;
  try {
    await client.connect();
    // await createLessons(client, [
    //   {
    //     id: 1,
    //     title: "Math",
    //     location: "London",
    //     price: 100000,
    //     image: "http://localhost:8080/images/math.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 2,
    //     title: "English",
    //     location: "East Blue",
    //     price: 100000,
    //     image: "http://localhost:8080/images/english.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 3,
    //     title: "Chemo",
    //     location: "California",
    //     price: 100000,
    //     image: "http://localhost:8080/images/chemo.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 4,
    //     title: "Physics",
    //     location: "Raftel",
    //     price: 100000,
    //     image: "http://localhost:8080/images/physics.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 5,
    //     title: "Robotics",
    //     location: "Shinganshina",
    //     price: 100000,
    //     image: "http://localhost:8080/images/robotics.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 6,
    //     title: "History",
    //     location: "Dubai",
    //     price: 100000,
    //     image: "http://localhost:8080/images/history.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 7,
    //     title: "French",
    //     location: "Germany",
    //     price: 100000,
    //     image: "http://localhost:8080/images/french.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 8,
    //     title: "Animation",
    //     location: "Spain",
    //     price: 100000,
    //     image: "http://localhost:8080/images/animation.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 9,
    //     title: "Music",
    //     location: "New York",
    //     price: 100000,
    //     image: "http://localhost:8080/images/music.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 10,
    //     title: "Design",
    //     location: "Italy",
    //     price: 100000,
    //     image: "http://localhost:8080/images/design.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    //   {
    //     id: 11,
    //     title: "Art",
    //     location: "Japan",
    //     price: 100000,
    //     image: "http://localhost:8080/images/art.jpg",
    //     space: 5,
    //     availableSpace: 5,
    //   },
    // ]);
  } catch (error) {
    console.log(error);
  }
  app.get("/", async function (req, res) {
    const result = await getAllLessons(client);
    res.json(result);
  });
  app.post("/order", async function (req, res) {
    // const name = req.body.name;
    // const phone = req.body.phone;
    // const orders = req.body.orders;
    const data = req.body;
    const result = await postOrder(client, data);
    res.json(result);
  });

  // app.put("/update-lesson", async function (req, res) {
  //   const lessonId =  req.body.id;
  //   const result = await updateLesson(client, lessonId);
  //   res.json(result);
  // });

  app.put("/remove-from-cart",async function (req,res){
    const lessonId = req.body.id;
    const qty = parseInt(req.body.qty);
    const result = await removeFromCart(client,lessonId,qty);
    res.json(result)
  })

  app.get("/search/", async function (req, res) {
    const search = req.query.searchTerm || "";
    const result = await searchDB(client, search);
    res.json(result);
  });

  async function removeFromCart(client,lessonId,qty){
    const lesson = await client
      .db(database)
      .collection(lessonsCollection)
      .findOne({ id: lessonId });
      console.log(lesson);
      if(lesson){
        while (lesson.space < 5) {
          const result = await client
            .db(database)
            .collection(lessonsCollection)
            .updateOne({ id: lessonId }, { $inc: { space: qty } });
          return result;
        }
      }
    
    return "Not removed";
  }

  async function getAllLessons(client) {
    const lessons = await client
      .db(database)
      .collection(lessonsCollection)
      .find();
    const results = await lessons.toArray();

    return results;
  }

  async function searchDB(client, searchTerm) {
    // const query = { $text: { $search: "ani"} };
    const lessons = await client
      .db(database)
      .collection(lessonsCollection)
      .find().toArray();

    if (searchTerm.length > 0){
      const results = lessons.filter((searchItem)=>{
        return searchItem.title.toLowerCase().match(searchTerm) || searchItem.location.toLowerCase().match(searchTerm)
      })
    
      console.log(results);
      return results;
    }

    return "Enter a search term"

    // client
    //   .db(database)
    //   .collection(lessonsCollection)
    //   .createIndex({ title: "text", location: "text" });
  }

  async function postOrder(client, data) {
    const result = await client
      .db(database)
      .collection(ordersCollection)
      .insertOne(data);
    await updateLesson(client,data)
    return result;
  }

  async function updateLesson(client, lessons) {
    lessons.forEach((lesson)=>{
      await client
      .db(database)
      .collection(lessonsCollection)
      .findOne({ id: lesson.id });
      console.log(lesson);
      if(lesson){
        while (lesson.space > 0) {
          const result = await client
            .db(database)
            .collection(lessonsCollection)
            .updateOne({ id: lesson.id }, { $inc: { space: -lesson.qty } });
          return result;
        }
      }
    })
    const lesson = await client
      .db(database)
      .collection(lessonsCollection)
      .findOne({ id: lessonId });
      console.log(lesson);
      if(lesson){
        while (lesson.space > 0) {
          const result = await client
            .db(database)
            .collection(lessonsCollection)
            .updateOne({ id: lessonId }, { $inc: { space: -1 } });
          return result;
        }
      }
    
    return "No items";
  }

  async function createLessons(client, lessons) {
    const result = await client
      .db(database)
      .collection(lessonsCollection)
      .insertMany(lessons);
    console.log(
      `${result.insertedCount} new lesson(s) created with the following id(s):`
    );
    console.log(result.insertedIds);
  }
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server listening on port:${PORT}`);
  });
};

main().catch(console.error);
