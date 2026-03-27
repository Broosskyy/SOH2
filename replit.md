# Azure Horizon Captain

Ein Phaser 3 Browser-Seeschlacht-Spiel mit Karten-Erkundung, Schiffskampf und Upgrade-System.

## Projektstruktur

- `index.html` – Einstiegspunkt, lädt Phaser 3 (v3.70.0), Tone.js und InstantDB via Import-Maps
- `main.js` – Phaser-Spielkonfiguration, startet `GameScene`
- `scenes/LoginScene.js` – Login + Registrierung (Tab-System), localStorage-Konten
- `scenes/LoadingScene.js` – Ladeszene (2.6s) mit Fortschrittsbalken
- `scenes/GameScene.js` – Hauptspielszene (5000+ Zeilen): Welt, Kamera, UI, Kampf, Karten, Upgrades
- `entities/` – Spielobjekte:
  - `Ship.js` – Basisklasse (Container) für alle Schiffe
  - `PlayerShip.js` – Spielerschiff mit Upgrade-System, Munitionstypen
  - `PlayerStats.js` – Statistikmodell des Spielers
  - `NPCShip.js` – Feindliche NPC-Schiffe (3 Tiers, Fraktionen, benannte Kapitäne)
  - `Monster.js` – Seeungeheuer (Kraken, Leviathan, Hai, Seedämon)
  - `Island.js` – Inseln als Hindernisse (6 Typen, Kreis-Kollision)
  - `Gift.js` – Loot-Drops (Gold, Materialien, XP)
- `ui/` – DOM & Phaser UI-Komponenten:
  - `Minimap.js` – Minimap-Komponente (190px, BOS-Stil, Goldrahmen, Koordinaten)
  - `PremiumShopPanel.js` – Premium-Item-Shop (4 Tabs: Upgrades, Munition, Besatzung, Premium)
  - `ShipDesignPanel.js` – Schiffswerft (4 Tabs: Designs, Talente, Upgrades, Status); 6 legendäre Klassen
  - `HafenPanel.js` – Hafen-Panel (4 Tabs: Taverne/Verbrauchsgüter, Reparatur, Verträge/Tagesziele, Navigation/Karten)
  - `ChatPanel.js` – DOM Chat mit /hilfe-Befehlen (/gold, /gems, /hp, /lvl, /event, /spawn npc, /speichern…)
  - `AdminPanel.js` – GM-Panel: Stats, Spawn, Teleport, Godmode, Weltsteuerung, Broadcast
  - `TalentPanel.js` – 3 Talent-Bäume (Seefahrer/Kriegsherr/Händler), Skillpunkte via Level-Up
  - `MultiplayerPanel.js` – BroadcastChannel-Multiplayer (selbe Domain, mehrere Tabs) mit Minimap-Markierungen
  - `LoginBonusPanel.js` – Täglich-Login-Bonus (7-Tage-Streak, Gold/Items/Gems)
  - `AchievementPanel.js` – 15 Erfolge (NPC-Kills, Monster, Gold, Schüsse, HP, Items, Karten)
  - `LogbookPanel.js` – Schiffslogbuch mit vollständigen Statistiken (persistiert)
  - `MissionPanel.js`, `BonusPanel.js`, `EventsPanel.js`, `RangPanel.js`, `BoardPanel.js`, `CombatPanel.js`
  - `AmmoBar.js`, `ChartNav.js`, `DomNavBar.js` (15 Buttons: Admin, Werft, Gilde, Chat, Events, Mission, Bonus, Quests, Shop, Rang, Hafen, Erfolge, Logbuch, Multi, Kanone)
- `assets/` – Alle Bild-Assets (WebP, PNG, JPG)
  - `island_guild_fortress.png` – KI-generierte Gildeninsel Festung (top-down, mit Hafeneinfahrt Süd)

## Gildeninsel-System (GuildIsland.js)

- Kreisförmige Steinfestung, 6 Kanonentürme um den Rand (verteilt, Lücke im Süden = Hafeneinfahrt)
- Türme bei Winkeln: NE, E, SE, SW, W, NW — Einfahrt bei S (π/2)
- Turmradius 148px, Festungs-Physik-Radius 168px
- Dedizierter Kampf-Timer (`_startGuildTowerCombat` / `_stopGuildTowerCombat`) — unabhängig vom Haupt-Auto-Feuer-System
- `getNearestActiveTower(px, py)` — gibt nächsten aktiven Turm zurück
- Angriff: Player klickt Turm → Timer feuert alle reloadMs → nächsten aktiven Turm beschießen
- Push-Back: Update-Loop verhindert Eindringen in die Festung (EXCLUSION_RADIUS 185px)
- Conquest: Alle 6 Türme zerstört → `guild-island-captured` Event → 90s Reset-Timer
- Gold-Bonus: Alle 30s +120 Gold nach Einnahme
- In-Game HUD: "GILDENINSEL — ANGRIFF LÄUFT" mit Stop-Button

## Backend & Datenbank-Architektur

- **`server.js`** — Node.js/Express-Server (Port 5000): Statische Dateien + REST-API
- **`api.js`** — Frontend ES-Modul: alle API-Aufrufe (Register, Login, Save, Load)
- **PostgreSQL-Datenbank** (Replit-gebaut, via `DATABASE_URL`): Tabelle `players`
  - `username`, `email`, `password_hash` (bcrypt, Runden=10)
  - `game_data`, `ship_data`, `upgrades`, `trial_data`, `achievements`, `login_streak`, `guild_data` (alle JSONB)
  - `cannon_tier` (INTEGER), `created_at`, `updated_at`

### API-Endpoints
- `POST /api/register` — Neues Konto erstellen (bcrypt-Hash)
- `POST /api/login` — Anmelden → liefert Bearer-Token (32-Byte Hex, 7 Tage gültig)
- `GET  /api/me` — Token validieren
- `GET  /api/load` — Gesamten Spielstand laden (benötigt Token)
- `POST /api/save` — Spielstand speichern (benötigt Token)
- `POST /api/logout` — Token ungültig machen

### Save/Load-Strategie
- **LoadingScene**: Ruft `apiLoad()` während der 2,6s Ladeanimation ab → speichert in `window._serverSaveData`
- **GameScene._loadProgress()**: Vergleicht `savedAt` von Server vs. localStorage → nimmt neueren Stand, synchronisiert alle Schlüssel
- **GameScene._saveProgress()**: Speichert zuerst in localStorage, dann fire-and-forget `apiSave()` mit allen Teilbereichen
- **Fallback**: Wenn kein Token → nur localStorage (Offline-/Demo-Modus)
- **LoginScene**: Versucht Server-Auth, fällt auf localStorage-Konten zurück wenn Offline

## Szenen-Fluss

`LoginScene` → `LoadingScene` (2.6s) → `GameScene`
- `window._loginUsername` speichert den Benutzernamen zwischen den Szenen

## Spielmechanik

- 10 Seekarten mit steigender Größe und Schwierigkeit
- Schiff navigiert per Klick (Punkt-zu-Punkt)
- Feinde auswählen und mit Kanonen/Harpune angreifen
- 6 Munitionstypen: Iron Ball, Leuchtkugel, Feuerkugel, Sturmkugel, Chain Shot, Grape Shot
- Skill-Bar mit 3 Kampffähigkeiten (Burst, Break, Repair) mit Cooldowns
- Upgrade-System: Rumpf, Segel, Kanonen, Decks, Munitionstechnik
- Gold und Materialien als Ressourcen; Edelsteine (gems) für Premium-Items

## NPC-System (3 Tiers)

- **Tier 1** (60%): Kleines Schiff (Kutter), Piraten/Schmuggler Fraktion, 260 HP
- **Tier 2** (30%): Mittelgroßes Schiff (Brigantin), Korsaren/Flibustier Fraktion, 560 HP
- **Tier 3** (10%): Großes Schiff (Kriegsschiff), Kriegsmarine/Teufelsgilde Fraktion, 1040 HP
- Jeder NPC hat Fraktionstag + benannten Kapitän (z.B. „[PIR] Roter Sam")
- Loot-Tabelle skaliert nach Tier (mehr Gold/XP für größere Gegner, mehrere Drops)

## Insel-System (6 Typen)

- `island-atoll`, `island-reef` – Klassische BOS-Inseln (webp)
- `island-tropical` – KI-generierte tropische Insel (PNG, transparent)
- `island-volcanic` – KI-generierte Vulkaninsel (PNG, transparent)
- `island-frozen` – KI-generierte arktische Insel (PNG, transparent)
- `island-ruins` – KI-generierte Ruinen-Insel (PNG, transparent)
- Alle Inseln verwenden **Kreis-Physik-Kollision** (setCircle, nicht setSize)
- Inseltypen wechseln zyklisch (per Index % 6)

## Login & Registrierung

- Zwei Tabs: "Anmeldung" und "Registrierung"
- Konten in `localStorage` als `ahc_accounts` Array gespeichert
- Validierung: Benutzername 3–20 Zeichen, gültige E-Mail, Passwort min. 6 Zeichen
- Ohne gespeicherte Konten: jeder Benutzername wird akzeptiert (Demo-Modus)

## Premium-Shop (PremiumShopPanel)

- 4 Tabs: Upgrades, Munition, Besatzung, Premium (Edelsteine)
- Gold-Items: Rumpf reparieren, Kanonenstärke, Geschwindigkeit, Nachladezeit, HP-Boost
- Munitions-Items: Leuchtfackel, Brandkugeln, Sturmkugeln, Kettenschuss, Kartätsche
- Besatzungs-Items: Kanonier, Schiffsarzt, Navigator, Spion
- Premium-Items (💎): Sofort-Reparatur, XP-Boost, Gold-Pack, Titan-Kanone
- Ersetzt den alten `ShopPanel`

## Schiffs-Assets

- `assets/player_ship_frigate_1.png` – KI-generierte dunkle Fregatte I
- `assets/player_ship_frigate_2.png` – KI-generierte dunkle Fregatte II
- `assets/player_ship_frigate_3.png` – KI-generierter Schwarzer Geist Fregatte
- `assets/ship_cutter_1-5.png` – KI-generierte Kutter (klein/schnell)
- `assets/ship_brig_1-3.png` – KI-generierte Brigantinen (mittel)
- `assets/ship_manwar_1-2.png` – KI-generierte Linienschiffe (groß/schwer)

## Schiffs-Größen & Skalierung

- Spielerschiff: scale 0.11 (vorher 0.05), Kollisionsradius 22
- NPC-Klein: scale 0.07, Kollisionsradius 18
- NPC-Mittel: scale 0.085, Kollisionsradius 22
- NPC-Groß: scale 0.10, Kollisionsradius 26

## Kill-Streak System

- `_onEnemyKilled(npc)` in GameScene — verfolgt aufeinanderfolgende Kills innerhalb von 12 Sekunden
- Combo-HUD erscheint mittig oben: `🔥 3× COMBO`, farbkodiert (gelb → orange → rot)
- Milestones: 3× (+8 Gold, +15 XP), 5× (+20 Gold, RAGE MODUS!), 10× (+60 Gold, +80 XP)
- **Rage Modus** (5+ Kill-Streak): +25% Speed, +20% Schaden, 8 Sekunden, rotes Overlay

## Schwimmende Schadenszahlen

- `showEnemyDamageFloat(x, y, damage, isCrit)` — weiß für Normal, rot für KRIT
- Krit-Treffer zeigen zusätzlich "KRIT!" Badge rechts neben der Zahl
- Phaser-Text-Objekte steigen auf und blenden aus (0.95s Tween)

## Händler-NPC

- Spawnt 1 Minute nach Spielstart, danach alle 3–5 Minuten automatisch
- Grün getintetes Schiff nähert sich dem Spieler mit Label "🛒 Händler"
- Bei Nähe < 260px öffnet sich der Händler-Shop: 3 zufällige Waren aus 6 Optionen
- Waren: Rum, Reparaturset, Donnerpulver, Grog, Seekarte (+200 Gold), Glücksbringer
- Verschwindet nach 60 Sekunden wenn nicht interagiert

## Level-Up Belohnungen (verbessert)

- `_getLevelUpRewards(level)` gibt Gold + Items + Labels zurück
- Alle 3 Level: ein Konsumable-Item (Rum / Grog / Reparaturset rotierend)
- Alle 5 Level (Meilenstein): +50 Bonus-Gold + spezielles Item
  - Lv.5 → 2× Rum, Lv.10 → 2× Grog, Lv.15 → Reparaturset, Lv.20 → Donnerpulver

## Klassen-basierte Schiffsgrößen (ShipDesignPanel)

- Kutter: scale 0.082 — Brigantine: 0.095 — Fregatte: 0.10 — Linienschiff: 0.13
- Schiffswahl persistiert via `ahc_ship_${username}` in localStorage
- Aktives Schiff-Info-Banner im Werft-Panel mit ★-Wertung für Geschw./Panzer/Kanonen

## Glücksbringer-Krit (Lucky Charm)

- Wenn "Lucky Charm" aktiv: Zufalls-Crit-Check mit 15% Chance pro Schuss → doppelter Schaden
- Integriert in den Angriffs-Loop, zeigt rote KRIT-Zahl

## Auto-Save

- Alle 5 Minuten automatisch gespeichert (via Update-Loop)
- "💾 Gespeichert"-Banner erscheint unten mittig (2s, dann fade-out)

## Server

- Statischer Dateiserver via `npx serve . -p 5000`
- Workflow: "Start application" auf Port 5000
