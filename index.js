require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const cors = require('cors');
const helmet = require('helmet');

const keys = require('./config/keys');
const routes = require('./routes');
const setupDB = require('./utils/db');

const { port } = keys;
const app = express();

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true
  })
);
app.use(cors());

require('./config/passport')(app);
app.use(routes);

// Only start serving once the database is actually reachable. Starting without
// it produces a server that answers non-DB routes and hangs on everything else.
setupDB()
  .then(() => {
    app.listen(port, () => {
      console.log(
        `${chalk.green('✓')} ${chalk.blue(
          `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
        )}`
      );
    });
  })
  .catch(error => {
    console.error(
      `${chalk.red('✗')} FATAL: could not connect to MongoDB — ${error.message}`
    );
    process.exit(1);
  });
