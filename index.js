import express from "express";
import { config } from "./config.js";
import Database from "./database.js";
import cors from "cors";

const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.status(201).json("Welcome to Hogwarts"));

app.get("/:searchText", (req, res) => {
  // searchText.split(' ')
  const searchText = req.params.searchText;
  // const searchTextArr = []
  // if ("and" in searchText) {
  //   searchTextArr = searchText.split(" and ");
  // }
  // console.log(searchText);
  const database = new Database(config);
  database
    .read(searchText)
    .then((searchResult) => {
      res.status(201).json(searchResult);
    })
    .catch((err) => {
      console.error(`Error searching text: ${err}`);
    });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
