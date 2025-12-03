import mongoose, { Schema, Document } from "mongoose";

export interface ICategory {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CategoryDocument = ICategory & Document;

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);


const Category = mongoose.model<CategoryDocument>("Category", categorySchema);

export default Category;
