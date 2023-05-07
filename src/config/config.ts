import dotenv from 'dotenv';
dotenv.config();

//const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
//const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
const MONGO_URL = `mongodb://localhost:27017`;

const SERVER_HOST_NAME = process.env.SERVER_HOST_NAME || 'http://127.0.0.1';
const SERVER_PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 1337;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'defaultaccesstokensecret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'defaultrefreshtokensecet';
const RESET_PASSWORD_TOKEN_SECRET =
   process.env.RESET_PASSWORD_TOKEN_SECRET || 'defaultresetpasswordtokensecet';

const CLIENT_WEB_HOST_NAME = process.env.CLIENT_WEB_HOST_NAME || 'http://127.0.0.1';
const CLIENT_WEB_PORT = process.env.CLIENT_WEB_PORT ? Number(process.env.CLIENT_WEB_PORT) : 3000;

export const config = {
   mongo: {
      url: MONGO_URL
   },
   server: {
      hostName: SERVER_HOST_NAME,
      port: SERVER_PORT,
      baseUrl: `${SERVER_HOST_NAME}:${SERVER_PORT}`
   },
   client: {
      web: {
         hostName: CLIENT_WEB_HOST_NAME,
         port: CLIENT_WEB_PORT,
         baseUrl: `${CLIENT_WEB_HOST_NAME}:${CLIENT_WEB_PORT}`
      }
   },
   token: {
      access: {
         secret: ACCESS_TOKEN_SECRET,
         expiresIn: '2h'
      },
      refresh: {
         secret: REFRESH_TOKEN_SECRET,
         expiresIn: '2d'
      },
      resetPassword: {
         secret: RESET_PASSWORD_TOKEN_SECRET,
         expiresIn: '1h'
      }
   }
};
