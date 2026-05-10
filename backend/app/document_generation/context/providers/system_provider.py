from datetime import date


class SystemContextProvider:
    def get_context(self) -> dict:
        current_date = date.today().strftime("%d.%m.%Y")
        return {
            "current_date": current_date,
            "document_date": current_date,
        }
