from bs4 import BeautifulSoup

for fn in ["examples/fl.ru.html", "examples/fl.ru-2.html"]:
    soup = BeautifulSoup(open(fn).read(), "html.parser")
    # find the text "Карточка товара" or "Schneider"
    for phrase in ["Карточка товара", "Schneider"]:
        found = soup.find(string=lambda t: t and phrase in t)
        if found:
            p = found.parent
            print(f"{fn} found '{phrase}': tag={p.name}, class={p.get('class')}, id={p.get('id')}")
            print("  parent tag:", p.parent.name, "parent class:", p.parent.get("class"))
            print("  text sample:", p.get_text()[:100])
