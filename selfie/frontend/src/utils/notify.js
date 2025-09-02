// utils/notify.js
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

export const showNotification = async ({ title, body }) => {
  await requestNotificationPermission();
  if (Notification.permission === "granted") {
    console.log("Showing notification:", title, body);
    new Notification(title, {
      body,
      // icon: "/icons/bell.png", // metti un'icona se vuoi, o rimuovi la proprietà
    });
  }
};
