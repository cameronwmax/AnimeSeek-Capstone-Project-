"use strict";

import axios from "axios";
import express from "express";

const app = express();
const port = 3000;

const randomURL = "https://api.jikan.moe/v4/random/anime";
const queryURL = "https://api.jikan.moe/v4/anime?q=";

let curPage;
const showsPerPage = 4;

async function getResult(url) {
  try {
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

function getData(data) {
  curPage = +data.dir;
  return JSON.parse(data.info);
}

function getStartEnd() {
  const start = (curPage - 1) * showsPerPage;
  const end = curPage * showsPerPage;
  return [start, end];
}

function getPage(info) {
  const slicePoints = getStartEnd();
  return info.allShows.slice(slicePoints[0], slicePoints[1]);
}

function createShowObj(show) {
  return {
    title: show.title,
    image: show.images.jpg.image_url,
    url: show.url,
  };
}

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  try {
    const result = await getResult(randomURL);

    const randShow = createShowObj(result);
    res.render("index.ejs", { randShow });
  } catch (error) {
    console.log(error);
  }
});

app.post("/", async (req, res) => {
  const show = req.body.show;
  try {
    const result = await getResult(`${queryURL}${show}`);

    const allShows = [];
    result.forEach((show) => {
      allShows.push(createShowObj(show));
    });

    curPage = 1;
    const numPages = Math.ceil(allShows.length / showsPerPage);
    const info = {
      curPage: curPage,
      numPages: numPages,
      allShows: allShows,
    };

    const shows = getPage(info);
    res.render("index.ejs", { shows, info });
  } catch (error) {
    console.log(error);
  }
});

app.post("/next", async (req, res) => {
  const info = getData(req.body);
  info.curPage = curPage;
  const shows = getPage(info);
  res.render("index.ejs", { shows, info });
});

app.post("/prev", async (req, res) => {
  const info = getData(req.body);
  info.curPage = curPage;
  const shows = getPage(info);
  res.render("index.ejs", { shows, info });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
