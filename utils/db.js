require('dotenv').config();
const chalk = require('chalk');
const mongoose = require('mongoose');

const keys = require('../config/keys');
const { database } = keys;

const setupDB = async () => {
  if (!database.url) {
    throw new Error(
      'MONGO_URI is not set. On Render, add it under Environment; locally, put it in .env'
    );
  }

  // Fail fast instead of letting Mongoose buffer queries forever when the
  // connection never establishes (that turns every DB route into a hang).
  await mongoose.connect(database.url, {
    serverSelectionTimeoutMS: 10000
  });

  console.log(`${chalk.green('✓')} ${chalk.blue('MongoDB Connected!')}`);
};

module.exports = setupDB;
