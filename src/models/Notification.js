import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Which budget triggered this alert.
    budget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      required: true,
    },

    // 50, 80 or 100.
    threshold: {
      type: Number,
      required: true,
      enum: [50, 80, 100],
    },

    // The message the user actually reads.
    message: {
      type: String,
      required: true,
    },

    // Snapshot of the numbers at the moment the alert fired.
    // Stored, not recalculated, so the alert history stays true even if the
    // user later edits the budget limit.
    category: { type: String, required: true },
    spent: { type: Number, required: true },
    limit: { type: Number, required: true },
    percentage: { type: Number, required: true },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// "My alerts, newest first" is the only query we run on this collection.
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
