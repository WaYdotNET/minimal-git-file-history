# Creazione Logo PNG

Per creare il logo PNG necessario per l'estensione VSCode:

## Opzione 1: Usa Python con Pillow

```bash
# Installa Pillow se non presente
pip3 install pillow

# Crea il logo PNG
python3 create_logo_png.py
```

## Opzione 2: Usa un convertitore SVG online

1. Apri `media/icon.svg` in un browser
2. Usa un convertitore online SVG→PNG (es. https://convertio.co/svg-png/)
3. Salva come `media/icon.png` (128x128 pixel)

## Opzione 3: Usa ImageMagick (se installato)

```bash
convert media/icon.svg -resize 128x128 media/icon.png
```

## Opzione 4: Usa Inkscape (se installato)

```bash
inkscape media/icon.svg -w 128 -h 128 -o media/icon.png
```

## Dopo aver creato il PNG

1. Aggiungi al package.json:
   ```json
   "icon": "media/icon.png"
   ```

2. Ricompila:
   ```bash
   npm run compile
   vsce package --no-yarn
   ```

## Note

- L'icona deve essere PNG (non SVG)
- Dimensioni consigliate: 128x128 pixel
- Il file deve essere `media/icon.png`
