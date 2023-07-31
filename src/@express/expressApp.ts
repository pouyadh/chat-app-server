import express from 'express';
import Logging from '../library/Logging';
import cookieParser from 'cookie-parser';
import generalHeadersOptions from './middlewares/general-headers-options';
import userRouter from './routes/user.router';
import { AppError } from '../library/AppError';
import expressJoiErrorHandlerMiddleware from './middlewares/express-joi-error-handler-middleware';

const expressApp = express();

expressApp.use(Logging.expressMiddleware());
expressApp.use(express.urlencoded({ extended: true, limit: '50mb' }));
expressApp.use(express.json({ limit: '50mb' }));
expressApp.use(cookieParser());
expressApp.use(generalHeadersOptions());

/** Routes */

expressApp.use('/user', userRouter);

/** Health Check */
expressApp.get('/ping', (req, res, next) => res.status(200).json({ message: 'pong' }));

expressApp.use(AppError.expressHandlerMiddleware);
expressApp.use(expressJoiErrorHandlerMiddleware);

expressApp.use((req, res, next) => {
   const error = new Error('not found');
   Logging.error(error);
   return res.status(404).json({ message: error.message });
});

export default expressApp;
