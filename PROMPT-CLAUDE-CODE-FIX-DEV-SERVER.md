# PROMPT CLAUDE CODE — Fix Dev Server (Turbopack crash)

## Problème

Le serveur de développement Next.js (`npm run dev`) ne fonctionne pas. Il crash immédiatement avec des erreurs Turbopack :

```
ENOENT: no such file or directory, open '.next/dev/server/app/page/build-manifest.json'
ENOENT: no such file or directory, open '.next/dev/server/pages/_app/build-manifest.json'
Failed to restore task data (corrupted database or bug)
Unable to open static sorted file
Persisting failed: Unable to write SST file
```

Le `rm -rf .next` ne suffit pas — le cache se re-corrompt immédiatement.

## Ce que tu dois faire

### Étape 1 — Kill TOUT et nettoyer
```bash
# Kill tous les process Node
killall -9 node 2>/dev/null
sleep 3

# Supprimer tous les caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf /tmp/next-*

# Vérifier que le port 3000 est libre
lsof -ti:3000 | xargs kill -9 2>/dev/null
```

### Étape 2 — Vérifier qu'il n'y a pas d'erreur de code
```bash
npx tsc --noEmit
```
Si des erreurs TypeScript apparaissent, corrige-les AVANT de relancer le serveur.

### Étape 3 — Relancer le serveur
```bash
npm run dev
```

### Étape 4 — Vérifier que ça marche
```bash
# Attends 5 secondes puis teste
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
Le résultat doit être `200`.

### Si ça ne marche toujours pas — Plan B
Si Turbopack continue de crash :

1. **Réinstaller node_modules** :
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

2. **Si ça ne marche TOUJOURS pas — désactiver Turbopack** temporairement :
Dans `package.json`, change le script dev :
```json
"dev": "next dev --turbopack=false"
```
Puis relance `npm run dev`.

3. **Dernier recours** — utiliser le build de production :
```bash
npm run build && npm start
```

## Contexte technique
- Next.js 16.1.6 avec Turbopack
- Le projet fonctionne correctement (build passe, tsc passe)
- C'est un problème de cache Turbopack corrompu, pas un bug dans le code
