import { Model, Schema, model, Types, HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
   username: string;
   email: string;
   name: string;
   avatarUrl: string;
   password: string;
   refreshToken?: string;
   contacts: Types.ObjectId[];
   privateMessages: {
      sender: Types.ObjectId;
      message: Types.ObjectId;
   }[];
   groupChats: Types.ObjectId[];
   channels: Types.ObjectId[];
   savedMessages: Types.ObjectId[];
   lastSeen: Date;
}
export interface IUserMethods {
   verifyPassword(password: string): boolean;
}

interface UserModel extends Model<IUser, {}, IUserMethods> {}

const schema = new Schema<IUser, UserModel, IUserMethods>(
   {
      username: { type: String, required: true, trim: true, lowercase: true, unique: true },
      email: { type: String, required: true, trim: true, lowercase: true, unique: true },
      name: { type: String, required: true },
      avatarUrl: { type: String, required: true },
      password: { type: String, required: true },
      refreshToken: { type: String },
      contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      privateMessages: [
         {
            sender: { type: Schema.Types.ObjectId, ref: 'User' },
            message: { type: Schema.Types.ObjectId, ref: 'Message' }
         }
      ],
      groupChats: [{ type: Schema.Types.ObjectId, ref: 'GroupChat' }],
      channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
      savedMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
      lastSeen: { type: Date, default: Date.now }
   },
   { timestamps: true, versionKey: false }
);

schema.pre('save', async function (next) {
   if (!this.isModified('password')) {
      return next();
   }
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(this.password, salt);
   this.password = hashedPassword;
   next();
});

schema.method('verifyPassword', function verifyPassword(password: string): boolean {
   return bcrypt.compareSync(password, this.password);
});

const User = model<IUser, UserModel>('User', schema);

export default User;

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
export type IUserWith_id = IUser & { _id: Types.ObjectId } & Required<{ _id: Types.ObjectId }>;
