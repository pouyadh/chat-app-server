import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
   username: string;
   email: string;
   name: string;
   avatarUrl: string;
   hashedPassword: string;
   refreshToken?: string;
}

export interface IUserModel extends IUser, Document {}

const UserSchema: Schema = new Schema(
   {
      username: { type: String, required: true, trim: true, lowercase: true, unique: true },
      email: { type: String, required: true, trim: true, lowercase: true, unique: true },
      name: { type: String, required: true },
      avatarUrl: { type: String, required: true },
      hashedPassword: { type: String, required: true },
      refreshToken: { type: String },
      contacts: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
      chats: [{ type: mongoose.Types.ObjectId, ref: 'Chat' }]
   },
   { timestamps: true, versionKey: false }
);

UserSchema.methods.comparePassword = function (password: string) {
   return bcrypt.compareSync(password, this.hashedPassword);
};

export default mongoose.model<IUserModel>('User', UserSchema);
