import Joi from 'joi';

const id = Joi.string().regex(/^[a-f\d]{24}$/i);

const fields = {
   id: Joi.string().regex(/^[a-f\d]{24}$/i),
   username: Joi.string().min(5).max(20),
   email: Joi.string().email(),
   password: Joi.string().min(8).max(20),
   resetToken: Joi.string(),
   name: Joi.string().min(3).max(100),
   avatarUrl: Joi.string(),

   title: Joi.string(),
   members: Joi.array().items(id),
   messageText: Joi.string()
};
export default fields;
