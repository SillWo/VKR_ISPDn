import type { ComponentType } from "react";

import { GenerateRknNotificationChangesForm } from "../ui/GenerateRknNotificationChangesForm";
import { GenerateRknNotificationForm } from "../ui/GenerateRknNotificationForm";

export const globalDocumentFormRegistry: Record<string, ComponentType> = {
  RKN_notification: GenerateRknNotificationForm,
  RKN_notification_changes: GenerateRknNotificationChangesForm,
};
