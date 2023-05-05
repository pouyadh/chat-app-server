import { Request } from 'express';
interface AppRequest extends Request {
   user?: any;
}
