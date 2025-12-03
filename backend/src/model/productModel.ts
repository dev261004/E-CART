// src/model/product/productModel.ts

import mongoose, { Schema, Document,Types } from "mongoose";


export interface IProduct {
  _id: string;
  vendor: string| Types.ObjectId;                    // userId (vendor)
  title: string;
  description?: string;
  price: number;
  category?: string| Types.ObjectId;                 // categoryId
  images: string[];                  // cloudinary image URLs
  stock: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}


 // Product Document (Mongoose Document + IProduct)

export type ProductDocument = IProduct & Document;


const productSchema = new Schema<ProductDocument>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    images: [
      {
        type: String,
        required: false // vendor may upload later
      }
    ],

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/**
 * Product Model
 */
const Product = mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
