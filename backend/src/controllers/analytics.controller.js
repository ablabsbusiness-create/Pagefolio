const Profile = require("../models/Profile");
const ProfileView = require("../models/ProfileView");
const slugifyUsername = require("../utils/slugifyUsername");
const apiResponse = require("../utils/apiResponse");

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket.remoteAddress || "unknown";
};

const trackProfileView = async (req, res, next) => {
  try {
    const username = slugifyUsername(req.params.username);
    const profile = await Profile.findOne({ username, isPublic: true });

    if (!profile) {
      return res.status(404).json(
        apiResponse({
          success: false,
          message: "Public profile not found"
        })
      );
    }

    await ProfileView.create({
      profileId: profile._id,
      username,
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown"
    });

    res.status(201).json(
      apiResponse({
        message: "Profile view tracked successfully"
      })
    );
  } catch (error) {
    next(error);
  }
};

const getAnalyticsByUsername = async (req, res, next) => {
  try {
    const username = slugifyUsername(req.params.username);

    if (req.user.username !== username) {
      return res.status(403).json(
        apiResponse({
          success: false,
          message: "You are not allowed to view analytics for this profile"
        })
      );
    }

    const profile = await Profile.findOne({ username, userId: req.user._id });

    if (!profile) {
      return res.status(404).json(
        apiResponse({
          success: false,
          message: "Profile not found"
        })
      );
    }

    const [totalViews, recentViews] = await Promise.all([
      ProfileView.countDocuments({ profileId: profile._id }),
      ProfileView.find({ profileId: profile._id })
        .sort({ viewedAt: -1 })
        .limit(20)
        .select("username viewedAt ip userAgent")
    ]);

    res.status(200).json(
      apiResponse({
        message: "Profile analytics fetched successfully",
        data: {
          profileId: profile._id,
          username: profile.username,
          totalViews,
          recentViews
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  trackProfileView,
  getAnalyticsByUsername
};
