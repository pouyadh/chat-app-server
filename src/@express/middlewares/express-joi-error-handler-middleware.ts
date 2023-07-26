import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import Logging from '../../library/Logging';
import httpStatus from 'http-status';

export default function (err: any, req: Request, res: Response, next: NextFunction) {
   if (err instanceof Joi.ValidationError) {
      Logging.error(err.message);
      res.status(httpStatus.BAD_REQUEST).json({ message: err.message });
   } else {
      next(err);
   }
}
