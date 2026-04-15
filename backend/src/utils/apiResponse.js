const apiResponse = ({ success = true, message = "Success", data = null }) => {
  return {
    success,
    message,
    data
  };
};

module.exports = apiResponse;
