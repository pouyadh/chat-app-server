import { NextFunction, Request, Response } from 'express';

export class AppError {
   status: number;
   message: string;
   constructor(status: number = 500, message: string = '') {
      this.status = status;
      this.message = message;
   }
   static expressHandlerMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
      if (err instanceof AppError) {
         const { status, message } = err;
         if (!message) {
            res.sendStatus(status);
         } else {
            res.status(status).json({ message });
         }
      } else {
         next(err);
      }
   }
}
