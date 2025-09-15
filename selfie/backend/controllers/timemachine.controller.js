import {
  setOffset,
  resetOffset,
  getOffset,
  getNow,
} from "../utils/timemachine.util.js";

export const setVirtualTime = (req, res) => {
  try {
    const { virtualTime } = req.body;
    if (!virtualTime) {
      return res.status(400).json({ error: "Missing virtualTime" });
    }

    const target = new Date(virtualTime);
    if (isNaN(target.getTime())) {
      return res.status(400).json({ error: "Invalid virtualTime format" });
    }

    const offsetMs = target.getTime() - Date.now();
    setOffset(offsetMs);

    return res.json({
      success: true,
      virtualTime: target,
      offsetMs,
    });
  } catch (err) {
    console.error("Failed to set virtual time:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getVirtualTime = (req, res) => {
  try {
    return res.json({
      systemNow: new Date(),
      virtualNow: getNow(),
      offsetMs: getOffset(),
    });
  } catch (err) {
    console.error("Failed to get virtual time:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const resetVirtualTime = (req, res) => {
  try {
    resetOffset();
    return res.json({
      success: true,
      virtualNow: new Date(),
      offsetMs: 0,
    });
  } catch (err) {
    console.error("Failed to reset virtual time:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
