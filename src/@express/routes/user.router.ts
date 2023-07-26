import express from 'express';
import userController from '../controllers/user.controller';

const userRouter = express.Router();

userRouter.post('/signup', ...userController.signUp);
userRouter.post('/signin', ...userController.signIn);
userRouter.delete('/signout', ...userController.signOut);
// prettier-ignore
userRouter.post('/send-reset-link-to-user-email',...userController.sendResetPasswordLinkToUserEmail);
userRouter.patch('/reset-password', ...userController.resetPassword);
userRouter.get('/token', ...userController.getToken);
userRouter.post('/delete-account', ...userController.deleteAccount);
userRouter.patch('/update-credentials', ...userController.updateCredentials);
userRouter.patch('/update-profile', ...userController.updateProfile);
userRouter.get('/', ...userController.getData);
userRouter.post('/public-profiles', ...userController.getPublicProfiles);

export default userRouter;
