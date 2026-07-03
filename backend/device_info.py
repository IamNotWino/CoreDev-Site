import re


def _browser_name(user_agent):
    ua = str(user_agent or "")
    if "Edg/" in ua or "Edge/" in ua:
        return "Microsoft Edge"
    if "OPR/" in ua or "Opera" in ua:
        return "Opera"
    if "Firefox/" in ua:
        return "Firefox"
    if "Chrome/" in ua and "Chromium" not in ua:
        return "Chrome"
    if "Safari/" in ua and "Chrome/" not in ua:
        return "Safari"
    if "MSIE" in ua or "Trident/" in ua:
        return "Internet Explorer"
    return "Браузер"


def _os_name(user_agent):
    ua = str(user_agent or "")
    if "Windows" in ua:
        return "Windows"
    if "Android" in ua:
        return "Android"
    if "iPhone" in ua or "iPad" in ua or "iOS" in ua:
        return "iOS"
    if "Mac OS X" in ua or "Macintosh" in ua:
        return "macOS"
    if "Linux" in ua:
        return "Linux"
    return "Устройство"


def build_device_label(user_agent):
    browser = _browser_name(user_agent)
    os_name = _os_name(user_agent)
    return f"{browser} · {os_name}"


def short_user_agent(user_agent):
    text = re.sub(r"\s+", " ", str(user_agent or "").strip())
    return text[:180] if text else "Неизвестное устройство"
