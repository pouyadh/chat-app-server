import express from 'express';
import controller from '../controllers/User';
import bodyValidator from '../middlewares/bodyValidator';
import * as schema from '../schemas/User';
import auth from '../middlewares/auth';

const router = express.Router();

router.get('/', auth(true), controller.getOwnUser);
router.post('/signup', bodyValidator(schema.singUp), controller.signUpUser);
router.post('/signin', bodyValidator(schema.signIn), controller.signInUser);
router.delete('/signout', auth(true), controller.signOutOwnUser);
router.post('/forgot-password', bodyValidator(schema.forgotPassword), controller.forgotPassword);
router.patch('/reset-password', bodyValidator(schema.resetPassword), controller.resetPassword);
router.get('/token', auth(true), controller.getToken);
router.get('/u/:username', controller.getUser);
router.get('/u/', controller.readAllUser);
router.patch('/update', auth(true), bodyValidator(schema.update), controller.updateOwnUser);
router.delete('/delete', auth(true), bodyValidator(schema.deleteUser), controller.deleteOwnUser);

export default router;
