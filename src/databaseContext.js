const config = require("./config");
const CosmosClient = require("@azure/cosmos").CosmosClient;

async function create(client, databaseId, containerId) {
const partitionKey = config.partitionKey;

const { database } = await client.databases.createIfNotExists({
    id: databaseId
});

const { container } = await client
    .database(databaseId)
    .containers.createIfNotExists(
        { id: containerId, partitionKey },
        { offerThroughput: 400 }
    );
}

export default create;
// module.exports = { create };