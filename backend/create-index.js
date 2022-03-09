const elasticClient = require("./elastic-client");

const createIndex = async (indexName) => {
  await elasticClient.indices.create({ index: indexName });
};

createIndex("posts");
