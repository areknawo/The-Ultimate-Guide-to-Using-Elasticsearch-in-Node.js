const express = require("express");
const bodyParser = require("body-parser");
const elasticClient = require("./elastic-client");
const { auth, requiresAuth } = require("express-openid-connect");
require("dotenv").config({ path: ".okta.env" });
require("express-async-errors");

const app = express();

app.use(bodyParser.json());
app.use(
  auth({
    issuerBaseURL: process.env.OKTA_OAUTH2_ISSUER,
    clientID: process.env.OKTA_OAUTH2_CLIENT_ID,
    clientSecret: process.env.OKTA_OAUTH2_CLIENT_SECRET,
    secret: process.env.OKTA_OAUTH2_CLIENT_SECRET,
    baseURL: "http://localhost:8080",
    idpLogout: true,
    authRequired: false,
    authorizationParams: {
      scope: "openid profile",
      response_type: "code",
    },
  })
);
app.get("/is-authenticated", (req, res) => {
  const authenticated = req.oidc.isAuthenticated();
  if (authenticated) {
    res.json({
      authenticated,
      username: req.oidc.user.name,
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.get("/", (req, res) => {
  res.redirect("http://localhost:3000/");
});

const securedRouter = express.Router();

securedRouter.use(requiresAuth());
securedRouter.post("/create-post", async (req, res) => {
  const result = await elasticClient.index({
    index: "posts",
    document: {
      title: req.body.title,
      author: req.body.author,
      content: req.body.content,
    },
  });

  res.send(result);
});
securedRouter.delete("/remove-post", async (req, res) => {
  const result = await elasticClient.delete({
    index: "posts",
    id: req.query.id,
  });

  res.json(result);
});
securedRouter.get("/search", async (req, res) => {
  const result = await elasticClient.search({
    index: "posts",
    query: { fuzzy: { title: req.query.query } },
  });

  res.json(result);
});
securedRouter.get("/posts", async (req, res) => {
  const result = await elasticClient.search({
    index: "posts",
    query: { match_all: {} },
  });

  res.send(result);
});

app.use(securedRouter);
app.listen(8080);
