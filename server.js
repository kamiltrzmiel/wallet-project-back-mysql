import { config } from 'dotenv';
import mysql from 'mysql2/promise';

config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const connection = mysql.createPool(dbConfig);

const startAnimation = () => {
  const animation = ['| ', '/ ', '- ', '\\ '];
  let index = 0;

  setInterval(() => {
    process.stdout.write('\r' + animation[index]);
    index = (index + 1) % animation.length;
  }, 80);
};

const runServer = async () => {
  try {
    await connection.getConnection();
    console.log('Database connection successful');
    console.log('>>> Press Ctrl+C to stop <<<');

    // app.listen(3000, () => {
    //   console.log('Server running. Use our API on port: 3000');
    //   console.log('>>> Press Ctrl+C to stop <<<');
    // });
  } catch (error) {
    console.log('Cannot connect to MySQL database');
    console.error(error);
    process.exit(1);
  }
};

runServer();
startAnimation();
