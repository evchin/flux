const config = {
  endpoint: "https://thearchitectscosmos.documents.azure.com:443/",
  key: "gcsVNTi0QWMV9Tl7QWampPnHe1l3J2EFEQ3WGIyUCfYKm7ZN9RbHHqWYbFxYr0kKtAKheU65UOQGN9Mw7Vc0aw",
  databaseId: "flux",
  containerId: "users",
  partitionKey: {kind: "Hash", paths: ["/region"]}
};

module.exports = config;