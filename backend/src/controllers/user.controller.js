const User = require("../models/User");
const Profile = require("../models/Profile");
const slugifyUsername = require("../utils/slugifyUsername");
const apiResponse = require("../utils/apiResponse");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const getMyUser = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    res.status(200).json(
      apiResponse({
        message: "User fetched successfully",
        data: {
          user: sanitizeUser(req.user),
          profile
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

const updateMyUser = async (req, res, next) => {
  try {
    const updates = {};

    if (req.body.name !== undefined) {
      const trimmedName = req.body.name.trim();

      if (!trimmedName) {
        return res.status(400).json(
          apiResponse({
            success: false,
            message: "Name cannot be empty"
          })
        );
      }

      updates.name = trimmedName;
    }

    if (req.body.email !== undefined) {
      const normalizedEmail = req.body.email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json(
          apiResponse({
            success: false,
            message: "Email cannot be empty"
          })
        );
      }

      const existingEmailUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user._id }
      });

      if (existingEmailUser) {
        return res.status(409).json(
          apiResponse({
            success: false,
            message: "Email is already in use"
          })
        );
      }

      updates.email = normalizedEmail;
    }

    if (req.body.username !== undefined) {
      const normalizedUsername = slugifyUsername(req.body.username);

      if (normalizedUsername.length < 3) {
        return res.status(400).json(
          apiResponse({
            success: false,
            message: "Username must be at least 3 valid characters long"
          })
        );
      }

      const existingUsernameUser = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: req.user._id }
      });
      const existingUsernameProfile = await Profile.findOne({
        username: normalizedUsername,
        userId: { $ne: req.user._id }
      });

      if (existingUsernameUser || existingUsernameProfile) {
        return res.status(409).json(
          apiResponse({
            success: false,
            message: "Username is already in use"
          })
        );
      }

      updates.username = normalizedUsername;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (updates.username) {
      await Profile.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { username: updates.username } },
        { new: true }
      );
    }

    res.status(200).json(
      apiResponse({
        message: "User updated successfully",
        data: sanitizeUser(user)
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyUser,
  updateMyUser
};
