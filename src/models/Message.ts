import { Model, Schema, model, Types } from 'mongoose';

export interface IMessage {
   sender: Types.ObjectId;
   content: {
      text: string;
   };
   outgoingStatus: 'sent' | 'delivered' | 'seen';
   edited: boolean;
   refrence?: {
      channel: Types.ObjectId;
      group: Types.ObjectId;
      user: Types.ObjectId;
      messageId: Types.ObjectId;
   };
}

interface IMessageMethods {}

const MessageSchema = new Schema<IMessage, {}, IMessageMethods>(
   {
      sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      content: {
         text: String
      },
      outgoingStatus: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
      edited: Boolean
   },
   { timestamps: true, versionKey: false }
);

export type MessageModel = Model<IMessage, {}, IMessageMethods>;
const Message = model<IMessage, MessageModel>('Message', MessageSchema);

export default Message;
