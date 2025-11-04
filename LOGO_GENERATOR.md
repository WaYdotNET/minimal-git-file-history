# Logo Generator per FZ Git History

Questo script genera i file PNG del logo per l'estensione FZ Git History usando `uv` e Pillow.

## Prerequisiti

- Python 3.8+
- `uv` (il package manager verrà installato automaticamente se non presente)

## Utilizzo

### Metodo 1: Script bash (consigliato)

Esegui con `bash` (funziona anche senza permessi di esecuzione):

```bash
bash generate_logo.sh
```

Oppure, se hai già i permessi di esecuzione:

```bash
./generate_logo.sh
```

Se ottieni un errore di permessi, esegui:

```bash
chmod +x generate_logo.sh
./generate_logo.sh
```

### Metodo 2: Manuale

Se preferisci eseguire i comandi manualmente:

```bash
# Installa Pillow con uv
uv pip install pillow

# Genera i logo
python3 create_logo_png.py
```

## File generati

Lo script crea:
- `media/icon.png` (128x128) - Icona per l'estensione VSCode
- `media/logo.png` (512x512) - Logo per documentazione

## Dipendenze

Le dipendenze sono gestite tramite `uv`:
- `pillow>=10.0.0` - Per la generazione delle immagini PNG
