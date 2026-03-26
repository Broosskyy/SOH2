# Azure Horizon Captain

Ein Phaser 3 Browser-Seeschlacht-Spiel mit Karten-Erkundung, Schiffskampf und Upgrade-System.

## Projektstruktur

- `index.html` – Einstiegspunkt, lädt Phaser 3 (v3.70.0), Tone.js und InstantDB via Import-Maps
- `main.js` – Phaser-Spielkonfiguration, startet `GameScene`
- `scenes/LoginScene.js` – Login + Registrierung (Tab-System), localStorage-Konten
- `scenes/LoadingScene.js` – Ladeszene (2.6s) mit Fortschrittsbalken
- `scenes/GameScene.js` – Hauptspielszene (3400+ Zeilen): Welt, Kamera, UI, Kampf, Karten
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
  - `ShipDesignPanel.js` – Schiffsdesign-Panel (13 Kategorien + Event-Beutedesigns)
  - `ChatPanel.js` – DOM Chat mit /hilfe-Befehlen (/gold, /gems, /hp, /lvl, /event, /spawn npc, /speichern…)
  - `AdminPanel.js` – GM-Panel: Stats, Spawn, Teleport, Godmode, Weltsteuerung, Broadcast
  - `TalentPanel.js` – 3 Talent-Bäume (Seefahrer/Kriegsherr/Händler), Skillpunkte via Level-Up
  - `MultiplayerPanel.js` – BroadcastChannel-Multiplayer (selbe Domain, mehrere Tabs) mit Minimap-Markierungen
  - `MissionPanel.js`, `BonusPanel.js`, `EventsPanel.js`, `RangPanel.js`, `BoardPanel.js`, `CombatPanel.js`
  - `AmmoBar.js`, `ChartNav.js`, `DomNavBar.js`
- `assets/` – Alle Bild-Assets (WebP, PNG, JPG)

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

## Server

- Statischer Dateiserver via `npx serve . -p 5000`
- Workflow: "Start application" auf Port 5000
