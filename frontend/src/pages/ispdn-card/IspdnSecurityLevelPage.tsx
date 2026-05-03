import { useParams } from "react-router-dom";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

export function IspdnSecurityLevelPage() {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage
      title="Уровень защищённости"
      description={`Заготовка раздела уровня защищённости для ИСПДн: ${ispdnId}.`}
    />
  );
}
