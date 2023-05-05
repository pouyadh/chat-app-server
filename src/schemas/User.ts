import Joi from 'joi';

export const username = Joi.string().min(5).max(20);
export const email = Joi.string().email();
export const password = Joi.string().min(8).max(20);
export const resetToken = Joi.string();
export const name = Joi.string().min(3).max(100);
export const avatarUrl = Joi.string();

export const singUp = Joi.object({
   username: username.required(),
   email: email.required(),
   password: password.required(),
   name: name.required(),
   avatarUrl: avatarUrl.required()
});

export const signIn = Joi.object({
   username: username.required(),
   password: password.required(),
   persistent: Joi.boolean()
});

export const forgotPassword = Joi.object({
   email: email.required()
});

export const resetPassword = Joi.object({
   password: password.required(),
   resetToken: resetToken.required()
});

export const update = Joi.object({
   username: username,
   email: email,
   name: name,
   avatarUrl: avatarUrl
});

export const deleteUser = Joi.object({
   password: password.required()
});
