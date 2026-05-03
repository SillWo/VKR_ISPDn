from datetime import date


class SystemContextProvider:
    def get_context(self) -> dict:
        return {"current_date": date.today().strftime("%d.%m.%Y")}
