import mongoose from "mongoose";

const cleanupMissionSchema = new mongoose.Schema(
  {
    missionId: {
      type: String,
      unique: true,
      index: true,
    },

    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
      index: true,
    },

    startLocation: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },
    },

    // Ordered route targets returned by the route planner
    targets: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    totalDistanceKm: {
      type: Number,
      default: 0,
    },

    estimatedDurationMinutes: {
      type: Number,
      default: 0,
    },

    priorityScore: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "planned",
        "active",
        "completed",
        "cancelled",
      ],
      default: "planned",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "CleanupMission",
  cleanupMissionSchema
);