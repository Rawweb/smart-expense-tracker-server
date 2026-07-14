import Notification from '../models/Notification.js';

// @desc    Get all alerts for the logged in user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    count: notifications.length,
    unreadCount, // this is the number on the bell icon
    notifications,
  });
};

// @desc    Mark one alert as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true },
  );

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.status(200).json({
    message: 'Notification marked as read',
    notification,
  });
};

// @desc    Mark all alerts as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

  res.status(200).json({ message: 'All notifications marked as read' });
};
