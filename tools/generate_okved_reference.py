from __future__ import annotations

import json
import re
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = PROJECT_ROOT / "tools" / "reference_sources" / "okved2.rtf"
OUTPUT_PATH = PROJECT_ROOT / "frontend" / "src" / "entities" / "okved" / "model" / "okved2.ts"

CODE_RE = re.compile(r"^\d{2}(?:\.\d{1,2}){0,3}$")
SECTION_A_RE = re.compile(r"^РАЗДЕЛ\s+A$")
SKIP_RTF_DESTINATIONS = {
    "colortbl",
    "datastore",
    "fonttbl",
    "info",
    "object",
    "pict",
    "stylesheet",
    "themedata",
}
DESCRIPTIVE_PREFIXES = (
    "-",
    "(",
    "В ред.",
    "Для целей",
    "Если ",
    "Класс ",
    "Описание ",
    "Примечание",
    "РАЗДЕЛ",
    "См.",
    "Смотри",
    "Такие виды",
    "Эта группировка",
    "Эти услуги",
    "Эта деятельность",
    "Этот раздел",
)
NAME_CUT_RE = re.compile(
    r"\s+(?:"
    r"В ред\.|"
    r"\(в ред\.|"
    r"Данная группировка|"
    r"Если |"
    r"См\.|"
    r"Смотри|"
    r"Такие виды|"
    r"Эта группировка|"
    r"Эти услуги|"
    r"Эта деятельность|"
    r"Этот раздел"
    r").*$",
    re.IGNORECASE,
)


def rtf_to_text(data: bytes) -> str:
    source = data.decode("latin1")
    output: list[str] = []
    index = 0
    depth = 0
    ignored_depth: int | None = None
    ignored_stack: list[int | None] = []

    while index < len(source):
        char = source[index]
        if char == "{":
            depth += 1
            ignored_stack.append(ignored_depth)
            index += 1
            continue

        if char == "}":
            depth -= 1
            ignored_depth = ignored_stack.pop() if ignored_stack else None
            index += 1
            continue

        if char != "\\":
            if ignored_depth is None:
                output.append(char)
            index += 1
            continue

        index += 1
        if index >= len(source):
            break

        control = source[index]
        if control in "\\{}":
            if ignored_depth is None:
                output.append(control)
            index += 1
            continue

        if control == "'" and index + 2 < len(source):
            hex_value = source[index + 1 : index + 3]
            if ignored_depth is None:
                try:
                    output.append(bytes.fromhex(hex_value).decode("cp1251"))
                except UnicodeDecodeError:
                    pass
            index += 3
            continue

        if not control.isalpha():
            if ignored_depth is None and control == "~":
                output.append(" ")
            index += 1
            continue

        word_start = index
        while index < len(source) and source[index].isalpha():
            index += 1
        word = source[word_start:index]

        is_negative = False
        if index < len(source) and source[index] == "-":
            is_negative = True
            index += 1

        number_start = index
        while index < len(source) and source[index].isdigit():
            index += 1
        number = source[number_start:index]

        if index < len(source) and source[index] == " ":
            index += 1

        if word in SKIP_RTF_DESTINATIONS:
            ignored_depth = depth
            continue

        if ignored_depth is not None:
            continue

        if word == "u" and number:
            code_point = int(number)
            if is_negative:
                code_point = -code_point
            if code_point < 0:
                code_point += 65536
            output.append(chr(code_point))
        elif word in {"par", "line"}:
            output.append("\n")
        elif word == "tab":
            output.append(" ")
        elif word == "emdash":
            output.append("—")
        elif word == "endash":
            output.append("–")

    return "".join(output)


def normalize_line(line: str) -> str:
    return re.sub(r"\s+", " ", line.replace("\xa0", " ")).strip()


def is_descriptive_line(line: str) -> bool:
    return any(line.startswith(prefix) for prefix in DESCRIPTIVE_PREFIXES)


def clean_name(line: str) -> str:
    return NAME_CUT_RE.sub("", line).strip(" .;")


def code_sort_key(code: str) -> tuple[int, ...]:
    return tuple(int(part) for part in code.split("."))


def extract_options(text: str) -> list[dict[str, str]]:
    lines = [normalize_line(line) for line in text.splitlines()]
    lines = [line for line in lines if line]

    start_index = next(
        (index for index, line in enumerate(lines) if SECTION_A_RE.fullmatch(line)),
        None,
    )
    if start_index is None:
        raise RuntimeError("Не найдено начало классификатора: РАЗДЕЛ A")

    options_by_code: dict[str, str] = {}
    for index in range(start_index, len(lines) - 1):
        code = lines[index]
        if not CODE_RE.fullmatch(code):
            continue

        name = clean_name(lines[index + 1])
        if CODE_RE.fullmatch(name) or is_descriptive_line(name):
            continue

        options_by_code.setdefault(code, name)

    return [
        {"code": code, "name": options_by_code[code]}
        for code in sorted(options_by_code, key=code_sort_key)
    ]


def render_typescript(options: list[dict[str, str]]) -> str:
    rows = ",\n".join(
        f"  {{ code: {json.dumps(item['code'], ensure_ascii=False)}, name: {json.dumps(item['name'], ensure_ascii=False)} }}"
        for item in options
    )
    return (
        "export type OkvedOption = {\n"
        "  code: string;\n"
        "  name: string;\n"
        "};\n\n"
        "export const okvedOptions: OkvedOption[] = [\n"
        f"{rows}\n"
        "];\n"
    )


def main() -> None:
    if not SOURCE_PATH.exists():
        raise FileNotFoundError(f"Исходный файл ОКВЭД 2 не найден: {SOURCE_PATH}")

    text = rtf_to_text(SOURCE_PATH.read_bytes())
    options = extract_options(text)
    if not options:
        raise RuntimeError("Справочник ОКВЭД не сформирован: записи не найдены")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(render_typescript(options), encoding="utf-8")
    print(f"Generated {OUTPUT_PATH.relative_to(PROJECT_ROOT)}")
    print(f"Records: {len(options)}")


if __name__ == "__main__":
    main()
