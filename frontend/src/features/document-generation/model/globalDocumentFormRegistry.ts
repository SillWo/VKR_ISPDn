import type { ComponentType } from "react";

import { GeneratePdnDocumentForm } from "../ui/GeneratePdnDocumentForm";
import { GeneratePdnSecurityForm } from "../ui/GeneratePdnSecurityForm";
import { GeneratePrikazOtvetZaPdnForm } from "../ui/GeneratePrikazOtvetZaPdnForm";
import { GenerateRknNotificationChangesForm } from "../ui/GenerateRknNotificationChangesForm";
import { GenerateRknNotificationForm } from "../ui/GenerateRknNotificationForm";

export const globalDocumentFormRegistry: Record<string, ComponentType> = {
  RKN_notification: GenerateRknNotificationForm,
  RKN_notification_changes: GenerateRknNotificationChangesForm,
  PDn_security: GeneratePdnSecurityForm,
  PDn_document: GeneratePdnDocumentForm,
  prikaz_otvet_za_PDn: GeneratePrikazOtvetZaPdnForm,
};
