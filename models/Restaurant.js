import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    settings: {
      currency: {
        type: String,
        default: "INR",
      },

      taxPercentage: {
        type: Number,
        default: 0,
      },

      serviceChargePercentage: {
        type: Number,
        default: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Restaurant =
  mongoose.models.Restaurant ||
  mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;