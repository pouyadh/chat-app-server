import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

const bodyValidator =
   (schema: ObjectSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.body);
      if (error) {
         return res.status(422).json({ message: error?.message });
      } else {
         next();
      }
   };
export default bodyValidator;
