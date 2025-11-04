# Istruzioni per Screenshot - Git File History Extension

Questo documento contiene istruzioni dettagliate per catturare gli screenshot necessari per il README dell'estensione.

## Preparazione

1. Assicurati di avere un repository Git con almeno 5-10 commit
2. Apri VSCode/Cursor con l'estensione installata
3. Apri un file che ha una storia di commit (preferibilmente un file TypeScript/JavaScript con modifiche)
4. Usa un tema chiaro per migliorare la visibilità nelle screenshot

---

## Screenshot 1: File History Sidebar View

**Obiettivo:** Mostrare la vista sidebar con la cronologia dei commit

**Passi:**
1. Apri un file qualsiasi nel progetto
2. Clicca con il tasto destro sul file nell'Explorer → "Show FZ Git History"
3. Espandi la sezione "Git File History" nella sidebar sinistra
4. Assicurati che siano visibili almeno 3-4 commit

**Cosa deve essere visibile:**
- ✅ La sidebar sinistra con la sezione "Git File History" espansa
- ✅ Il nome del file nella parte superiore della tree view
- ✅ Almeno 3-4 commit visibili con:
  - Messaggio del commit (truncato se troppo lungo)
  - Autore del commit
  - Data relativa (es: "2 hours ago")
- ✅ Icona di refresh nella toolbar della view (se presente)
- ✅ Icone dei commit (git-commit icon)

**Annotazione:** Aggiungi una freccia o evidenziazione che punti alla sezione "Git File History"

**Nome file suggerito:** `screenshot-file-history-sidebar.png`

---

## Screenshot 2: Git Blame Annotations

**Obiettivo:** Mostrare le annotazioni Git Blame inline nel codice

**Passi:**
1. Apri un file con codice sorgente (almeno 20-30 righe)
2. Clicca con il tasto destro nell'editor → "Toggle Git Blame"
3. Attendi che le annotazioni appaiano sopra le righe di codice

**Cosa deve essere visibile:**
- ✅ Editor con codice sorgente visibile
- ✅ Annotazioni Code Lens sopra le righe di codice con formato:
  - `Author Name • abc1234 • 2 hours ago`
- ✅ Almeno 4-5 righe diverse con annotazioni visibili
- ✅ Evidenzia che le annotazioni sono cliccabili (mostra hover se possibile)

**Suggerimento:** Usa un file con codice ben formattato e colorato per migliorare la leggibilità

**Nome file suggerito:** `screenshot-git-blame-annotations.png`

---

## Screenshot 3: Diff Viewer - Compare Versions

**Obiettivo:** Mostrare il diff viewer side-by-side con confronto tra commit

**Passi:**
1. Clicca con il tasto destro su un file → "Compare with Previous Commit"
2. Oppure seleziona un commit nella history view e usa "Compare with Previous"

**Cosa deve essere visibile:**
- ✅ Diff viewer aperto con due colonne side-by-side
- ✅ Titolo della vista diff che mostra le due versioni (es: "Commit abc1234^ ↔ Commit abc1234")
- ✅ Righe evidenziate:
  - **Verde**: righe aggiunte
  - **Rosso**: righe rimosse
  - **Grigio**: righe di contesto
- ✅ Almeno un hunk header visibile (es: `@@ -10,5 +10,8 @@`)
- ✅ Numeri di riga visibili

**Suggerimento:** Scegli un commit con modifiche significative ma non troppo complesse

**Nome file suggerito:** `screenshot-diff-viewer.png`

---

## Screenshot 4: Context Menu

**Obiettivo:** Mostrare il menu contestuale con le opzioni dell'estensione

**Passi:**
1. Clicca con il tasto destro su un file nell'Explorer (non nell'editor)
2. Cattura il menu contestuale prima che scompaia

**Cosa deve essere visibile:**
- ✅ Menu contestuale aperto
- ✅ Sezione "Git File History" o gruppo "git-history" visibile con:
  - ✅ "Show FZ Git History"
  - ✅ "Compare with Working Directory"
- ✅ Evidenziazione visibile delle opzioni del menu
- ✅ Altri elementi del menu per contesto (Copy, Rename, etc.)

**Suggerimento:** Usa un tema che evidenzi bene le sezioni del menu

**Nome file suggerito:** `screenshot-context-menu.png`

---

## Screenshot 5: Commit Details View

**Obiettivo:** Mostrare un file visualizzato a un commit specifico

**Passi:**
1. Nella File History view, clicca su un commit
2. Si aprirà un nuovo editor con il contenuto del file a quel commit
3. Cattura l'editor con il tab visibile

**Cosa deve essere visibile:**
- ✅ Editor con file aperto
- ✅ Tab dell'editor che mostra il nome del file e lo schema URI (git-file-history:...)
- ✅ Contenuto del file che riflette lo stato a quel commit
- ✅ Numero di riga visibile nella gutter

**Suggerimento:** Scegli un commit dove il file aveva contenuto diverso dal corrente

**Nome file suggerito:** `screenshot-commit-details-view.png`

---

## Screenshot 6: Compare Two Commits Dialog

**Obiettivo:** Mostrare il dialog Quick Pick per selezionare commit da confrontare

**Passi:**
1. Clicca con il tasto destro su un file → "Compare Two Commits"
2. Cattura il Quick Pick dialog quando appare

**Cosa deve essere visibile:**
- ✅ Quick Pick dialog aperto al centro dello schermo
- ✅ Placeholder "Select first commit" o "Select second commit"
- ✅ Lista di almeno 3-4 commit visibili con:
  - Messaggio del commit (label)
  - Hash breve e autore (description)
- ✅ Un commit evidenziato/selezionato
- ✅ Barra di ricerca visibile (se presente)

**Suggerimento:** Assicurati che ci siano abbastanza commit nella cronologia

**Nome file suggerito:** `screenshot-compare-dialog.png`

---

## Screenshot Bonus: Editor Context Menu

**Opzionale ma utile:** Mostrare il menu contestuale nell'editor

**Passi:**
1. Clicca con il tasto destro dentro l'editor (su una riga di codice)
2. Cattura il menu

**Cosa deve essere visibile:**
- ✅ Menu contestuale dell'editor
- ✅ Sezione "Git File History" con:
  - "Show FZ Git History"
  - "Toggle Git Blame"
  - "Compare with Previous Commit"
  - "Compare with Working Directory"

**Nome file suggerito:** `screenshot-editor-context-menu.png`

---

## Note Tecniche

### Dimensioni e Formato
- **Formato:** PNG (preferito) o JPG
- **Risoluzione:** Minimo 1280x720, preferibilmente 1920x1080 o superiore
- **Dimensione file:** Cerca di mantenere sotto 500KB per file

### Qualità
- Usa temi chiari per migliore leggibilità
- Evita informazioni sensibili (email, nomi utente personali se possibile)
- Aggiungi annotazioni/frecce se necessario per chiarire funzionalità
- Assicurati che il testo sia leggibile

### Post-Processing
- Puoi aggiungere frecce rosse, box evidenziati, o annotazioni per guidare l'occhio
- Mantieni il focus sulla funzionalità principale
- Taglia bordi bianchi inutili ma mantieni un po' di spazio attorno

---

## Checklist Finale

Prima di inserire gli screenshot nel README:

- [ ] Screenshot 1: File History Sidebar View
- [ ] Screenshot 2: Git Blame Annotations
- [ ] Screenshot 3: Diff Viewer
- [ ] Screenshot 4: Context Menu (Explorer)
- [ ] Screenshot 5: Commit Details View
- [ ] Screenshot 6: Compare Dialog
- [ ] (Opzionale) Screenshot Bonus: Editor Context Menu

Tutti gli screenshot sono stati:
- [ ] Ridimensionati appropriatamente
- [ ] Ottimizzati per dimensioni file
- [ ] Verificati per leggibilità
- [ ] Nominati secondo le convenzioni
