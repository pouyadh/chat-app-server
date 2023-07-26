import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

export default function (schema: ObjectSchema<any>) {
   return (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.params);
      if (error) {
         return res.status(422).json({ message: error.message });
      } else {
         next();
      }
   };
}
