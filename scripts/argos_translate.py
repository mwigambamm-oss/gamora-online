import sys
import os
import contextlib
import logging
import re

logging.disable(logging.CRITICAL)

with open(os.devnull, "w") as devnull:
    with contextlib.redirect_stderr(devnull):
        import argostranslate.translate


# =========================================================
# GAMORA CONTROLLED ECOMMERCE TERMS
# =========================================================

KEY_TRANSLATIONS = {
    "material": "Nyenzo",
    "color": "Rangi",
    "colour": "Rangi",
    "size": "Ukubwa",
    "weight": "Uzito",
    "gender": "Jinsia",
    "pockets": "Mifuko",
    "closure": "Kifungio",
    "bag type": "Aina ya Mkoba",
    "suitable for": "Inafaa kwa",
    "style": "Mtindo",
    "design": "Muundo",
    "capacity": "Uwezo",
    "brand": "Chapa",
    "model": "Modeli",
    "storage": "Hifadhi",
    "screen size": "Ukubwa wa Skrini",
    "battery": "Betri",
    "battery capacity": "Uwezo wa Betri",
    "processor": "Prosesa",
    "memory": "Kumbukumbu",
    "ram": "RAM",
    "storage capacity": "Uwezo wa Hifadhi",
    "operating system": "Mfumo wa Uendeshaji",
    "warranty": "Dhamana",
    "country of origin": "Nchi ya Asili",
}


VALUE_TRANSLATIONS = {
    "leather": "Ngozi",
    "black": "Nyeusi",
    "brown": "Kahawia",
    "pink": "Waridi",
    "beige": "Beji",
    "white": "Nyeupe",
    "red": "Nyekundu",
    "blue": "Bluu",
    "green": "Kijani",
    "yellow": "Njano",
    "purple": "Zambarau",
    "orange": "Machungwa",
    "grey": "Kijivu",
    "gray": "Kijivu",

    # Technical / measurement values
    "350g": "350g",
    "500g": "500g",
    "1kg": "1kg",
    "2kg": "2kg",
    "3kg": "3kg",
    "4kg": "4kg",
    "5kg": "5kg",

    "medium": "Wastani",
    "large": "Kubwa",
    "small": "Ndogo",

    "women": "Wanawake",
    "woman": "Mwanamke",
    "men": "Wanaume",
    "man": "Mwanaume",

    "multiple pockets": "Mifuko mingi",
    "zipper": "Zipu",
    "crossbody bag": "Mkoba wa Kubebea Begani",
    "crossbody": "Kubebea Begani",

    "daily use": "Matumizi ya kila siku",
    "shopping": "Ununuzi",
    "travel": "Usafiri",
}


def exact_term(text, dictionary):
    value = text.strip()

    # Exact match, case insensitive
    for english, swahili in dictionary.items():
        if value.lower() == english.lower():
            return swahili

    return None


def translate_with_argos(text):
    text = text.strip()

    if not text:
        return ""

    exact = exact_term(text, VALUE_TRANSLATIONS)

    if exact:
        return exact

    result = argostranslate.translate.translate(
        text,
        "en",
        "sw"
    )

    return result.strip()


def translate_specification_line(line):
    """
    Translate one specification safely:
    English Key: English Value
    """

    if ":" not in line:
        return translate_controlled_value(line)

    key, value = line.split(":", 1)

    key = key.strip()
    value = value.strip()

    translated_key = exact_term(key, KEY_TRANSLATIONS)

    if not translated_key:
        translated_key = translate_with_argos(key)

    translated_value = translate_controlled_value(value)

    return f"{translated_key}: {translated_value}"


def translate_controlled_value(value):
    """
    Translate product values safely.

    Known ecommerce values are translated directly.
    Comma-separated colors/sizes are translated item by item.
    Technical measurements are preserved.
    """

    value = value.strip()

    if not value:
        return ""

    exact = exact_term(value, VALUE_TRANSLATIONS)

    if exact:
        return exact

    # Split comma-separated values and the final "and"
    parts = re.split(r"(\s*,\s*|\s+and\s+)", value, flags=re.IGNORECASE)

    output = []

    for part in parts:
        if not part:
            continue

        stripped = part.strip()

        if not stripped:
            continue

        # Keep comma structure
        if stripped == ",":
            if output:
                output[-1] = output[-1].rstrip() + ","
            continue

        # English "and" -> Swahili "na"
        if stripped.lower() == "and":
            output.append(" na ")
            continue

        # Keep technical measurements unchanged
        if re.fullmatch(
            r"\d+(?:\.\d+)?\s*(?:g|kg|mg|ml|l|cm|mm|m|inch|in)",
            stripped,
            re.IGNORECASE,
        ):
            output.append(stripped)
            continue

        # Translate known product value directly
        translated = exact_term(stripped, VALUE_TRANSLATIONS)

        if translated:
            output.append(translated)
            continue

        # Otherwise use Argos only for unknown values
        output.append(translate_with_argos(stripped))

    result = "".join(output)

    # Normalize comma spacing
    result = re.sub(r"\s*,\s*", ", ", result)
    result = re.sub(r"\s+na\s+", " na ", result)

    return result.strip()

def translate_text(text):
    """
    General product text.

    If the input contains specification-style lines,
    translate each line independently.
    Otherwise use Argos normally.
    """

    if not text.strip():
        return ""

    lines = text.splitlines()

    # Detect specification-style content
    specification_lines = [
        line for line in lines
        if ":" in line and line.strip()
    ]

    if len(specification_lines) >= 2:
        output = []

        for line in lines:
            if not line.strip():
                output.append("")
                continue

            output.append(
                translate_specification_line(line)
            )

        return "\n".join(output).strip()

    # Normal paragraph/product description
    result = translate_with_argos(text)

    # Basic post-translation corrections
    corrections = {
        "Mavazi ya wanawake": "Mkoba wa wanawake",
        "Mavazi ya Wanawake": "Mkoba wa Wanawake",
        "kompakt": "ndogo",
        "sio lazima": "si lazima",
    }

    for english, swahili in corrections.items():
        result = result.replace(english, swahili)

    # Clean whitespace
    result = re.sub(r"[ \t]+", " ", result)
    result = re.sub(r"\s+([,.!?;:])", r"\1", result)

    return result.strip()


text = sys.stdin.read()

if not text.strip():
    print("")
    sys.exit(0)

print(translate_text(text))
