import mongoose, { Document, Schema } from 'mongoose';

export interface IUser {
   username: string;
   email: string;
   name: string;
   avatarUrl: string;
   hashedPassword: string;
   refreshToken?: string;
   contacts: mongoose.Types.ObjectId[];
   chats: mongoose.Types.ObjectId[];
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

export default mongoose.model<IUserModel>('User', UserSchema);
