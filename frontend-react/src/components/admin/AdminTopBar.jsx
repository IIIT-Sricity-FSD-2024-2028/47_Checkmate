import React, { useState } from "react";
import TopHeaderBar from "../TopHeaderBar";
import NotificationModal from "../NotificationModal";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";

/**
 * TopHeaderBar for every admin page, with the notifications bell wired up.
 * The badge shows the notification count until the modal is opened once.
 */
function AdminTopBar({ title }) {
  const notifications = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);

  return (
    <>
      <TopHeaderBar
        title={title}
        badge={seen ? 0 : notifications.length}
        onNotificationClick={() => {
          setOpen(true);
          setSeen(true);
        }}
      />
      <NotificationModal open={open} items={notifications} onClose={() => setOpen(false)} />
    </>
  );
}

export default AdminTopBar;
