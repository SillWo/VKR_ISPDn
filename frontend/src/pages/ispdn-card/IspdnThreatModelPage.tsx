import { useParams } from "react-router-dom";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

export function IspdnThreatModelPage() {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage
      title="Модель угроз"
      description={`Заготовка раздела модели угроз для ИСПДн: ${ispdnId}.`}
    />
  );
}
