import type { ComponentType } from "react";

import { GenerateRknNotificationForm } from "../ui/GenerateRknNotificationForm";

export const globalDocumentFormRegistry: Record<string, ComponentType> = {
  RKN_notification: GenerateRknNotificationForm,
};
