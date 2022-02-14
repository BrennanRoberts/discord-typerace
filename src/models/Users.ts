import { MongoClient } from "mongodb";
// List users by highest wpm
// List users by most wins

const url = "mongodb://localhost:27017";

const dbName = "discrace";

const UserResults = {
  async save(userId: string, wpm: number, placement: number) {
    console.log(userId);
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db(dbName);
    const resultsCollection = db.collection("UserResults");
    await resultsCollection.insertOne({ userId, wpm, placement });
    await client.close();
  },

  async readTopScorers() {
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db(dbName);
    const resultsCollection = db.collection("UserResults");
    const pipeline = [
      {
        $group: { _id: "$userId", averageWpm: { $avg: "$wpm" } },
      },
      {
        $sort: { wpm: -1 },
      },
    ];
    const results = await resultsCollection.aggregate(pipeline).toArray();
    await client.close();
    return results;
  },
};

export default UserResults;
