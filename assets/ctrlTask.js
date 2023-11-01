export const ctrlTask = ctrl => {
  //runCtrl jako middleware dla Express
  const runCtrl = async (req, res, next) => {
    try {
      await ctrl(req, res, next);
    } catch (error) {
      next(error);
    }
  };
  return runCtrl;
};
