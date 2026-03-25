import requests

r = requests.get('http://localhost:5000/api/projects/8326ae3b-4d26-45c5-a174-fa016dbd381b/preview-html', timeout=5)
html = r.text

print(f'Status: {r.status_code}')
print(f'Longueur HTML: {len(html)} caractères')
print(f'Commence par DOCTYPE: {html.startswith("<!DOCTYPE")}')
print(f'Contient <body>: {"<body>" in html}')
print(f'Contient </html>: {"</html>" in html}')
print(f'Contient gradient: {"gradient" in html}')
print(f'\nPremières 500 chars:\n{html[:500]}')
print(f'\nDernières 200 chars:\n{html[-200:]}')

# Sauvegarde le HTML dans un fichier pour inspection
with open('c:\\Darknexus-main\\preview_test.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('\n✅ HTML sauvegardé dans preview_test.html')
