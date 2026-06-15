import type { IspdnCard, IspdnFormValues } from "./types";

export function toIspdnFormValues(card: IspdnCard): IspdnFormValues {
  return {
    name: card.name,
    shortDescription: card.shortDescription,
    commissioningDate: card.commissioningDate,
    decommissioningDate: card.decommissioningDate ?? "",
    websiteUrl: card.websiteUrl ?? "",
    responsibleEmployeeId: card.responsibleEmployeeId,
    systemComposition:
      card.systemComposition.length > 0
        ? card.systemComposition.map((item) => ({
            name: item.name,
            description: item.description,
          }))
        : [{ name: "", description: "" }],
    securityTools: {
      ...card.securityTools,
      otherSecurityTools: card.securityTools.otherSecurityTools ?? "",
    },
    status: card.status,
  };
}
