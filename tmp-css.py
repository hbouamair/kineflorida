import urllib.request
import re

html = urllib.request.urlopen("http://localhost:3000/fr").read().decode("utf-8", "ignore")
urls = re.findall(r"/_next/static/[^\"']+\.css", html)
print("urls", len(urls))
for url in urls[:6]:
    css = urllib.request.urlopen("http://localhost:3000" + url).read().decode("utf-8", "ignore")
    print(url, "len", len(css), "menu-grid", ".menu-toggle {" in css, "bar96", "--bar: 96px" in css, "28px", "100% - 28px" in css)
