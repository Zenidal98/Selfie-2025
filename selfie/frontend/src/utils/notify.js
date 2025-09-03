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

export const showNotification = ({ title, body }) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icons/bell.png", // metti un'icona se vuoi, o rimuovi la proprietà
    });
  }
};
