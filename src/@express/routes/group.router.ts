import { Router } from 'express';
import auth from '../middlewares/auth';
import groupChatController from '../controllers/group-chat.controller';

const groupChatRouter = Router();
groupChatRouter.use(auth(true));
groupChatRouter.get('/:groupChatId/public-profile', ...groupChatController.getInfo);

export default groupChatRouter;
