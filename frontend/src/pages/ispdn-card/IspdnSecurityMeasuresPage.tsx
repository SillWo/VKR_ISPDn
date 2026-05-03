import { useParams } from "react-router-dom";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

export function IspdnSecurityMeasuresPage() {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage
      title="Технические меры защиты"
      description={`Заготовка раздела технических мер защиты для ИСПДн: ${ispdnId}.`}
    />
  );
}
