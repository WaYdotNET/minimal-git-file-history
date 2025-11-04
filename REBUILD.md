# Istruzioni per ricompilare con il nuovo nome

Il nome dell'estensione è stato cambiato da `git-file-history` a `fz-git-file-histrory`.

## Passi da eseguire manualmente:

```bash
cd /Users/waydotnet/works/study/fz-git-file-histrory

# 1. Rimuovi i vecchi pacchetti VSIX
rm -f git-file-history-*.vsix

# 2. Ricompila TypeScript
npm run compile

# 3. Crea il nuovo pacchetto VSIX
vsce package --no-yarn

# 4. Verifica che il pacchetto sia stato creato
ls -lh fz-git-file-histrory-*.vsix

# 5. Installa l'estensione
code --install-extension fz-git-file-histrory-0.1.0.vsix --force

# Oppure usa lo script di installazione:
./install.sh
```

## Verifica

Il package.json dovrebbe avere:
- `"name": "fz-git-file-histrory"`

Il file VSIX creato dovrebbe chiamarsi:
- `fz-git-file-histrory-0.1.0.vsix`

## Note

- Lo script `install.sh` è già stato aggiornato per cercare il nuovo nome
- Il nome della directory temporanea in `diffViewer.ts` è stato aggiornato
- Il nome dello schema URI (`git-file-history:`) può rimanere uguale (è solo interno)
