import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  googleId: { type: String, unique: true, required: true },
  email: { type: String, required: true },
  name: { type: String },
}, { timestamps: true });

export default model('User', UserSchema);