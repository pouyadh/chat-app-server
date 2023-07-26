import { Router } from 'express';
import auth from '../middlewares/auth';
import channelController from '../controllers/channel.controller';

const channelRouter = Router();
channelRouter.use(auth(true));

channelRouter.get('/:channelId/public-profile', ...channelController.getInfo);
