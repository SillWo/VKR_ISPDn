import { useParams } from "react-router-dom";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

export function IspdnProcessingPage() {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage
      title="Процессы обработки"
      description={`Заготовка раздела процессов обработки для ИСПДн: ${ispdnId}.`}
    />
  );
}
