# Centre Kinésithérapie Florida

Site de rendez-vous, en français et en arabe. Next.js.

```bash
npm run dev
```

Ouvrir [http://localhost:3000/fr](http://localhost:3000/fr). L'arabe est sur `/ar`. L'agenda du centre est sur `/admin`.

Le patient choisit un soin, un jour et une heure. Le rendez-vous est enregistré **en attente**. Le tableau de bord confirme, annule, termine, ou marque le paiement au centre.

Les prix viennent du catalogue. L'adresse, le téléphone, les horaires confirmés et le nom derrière « By S.B. » ne sont pas dans les documents: ils restent marqués sur le site.

Pour enregistrer de vrais rendez-vous :

1. Exécuter `supabase/schema.sql` dans l'éditeur SQL Supabase.
2. Créer un utilisateur dans Authentication, avec « Auto Confirm ».
3. Copier `supabase/env.example` vers `.env.local` et remplir l'URL, la clé publishable, et `SUPABASE_SECRET_KEY` (serveur seulement).
