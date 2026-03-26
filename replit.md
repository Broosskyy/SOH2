# Azure Horizon Captain

Ein Phaser 3 Browser-Seeschlacht-Spiel mit Karten-Erkundung, Schiffskampf und Upgrade-System.

## Projektstruktur

- `index.html` – Einstiegspunkt, lädt Phaser 3 (v3.70.0), Tone.js und InstantDB via Import-Maps
- `main.js` – Phaser-Spielkonfiguration, startet `GameScene`
- `scenes/GameScene.js` – Hauptspielszene (3300+ Zeilen): Welt, Kamera, UI, Kampf, Karten
- `entities/` – Spielobjekte:
  - `Ship.js` – Basisklasse für alle Schiffe
  - `PlayerShip.js` – Spielerschiff mit Upgrade-System, Munitionstypen
  - `PlayerStats.js` – Statistikmodell des Spielers
  - `NPCShip.js` – Feindliche NPC-Schiffe
  - `Monster.js` – Seeungeheuer (Kraken, Leviathan, Hai, Seedämon)
  - `Island.js` – Inseln als Hindernisse
  - `Gift.js` – Loot (Gold, Materialien, XP)
- `ui/Minimap.js` – Minimap-Komponente
- `assets/` – Alle Bild-Assets (WebP, PNG, JPG)
- `rosie/` – Rosie-Integrations-Controls

## Spielmechanik

- 10 Seekarten mit steigender Größe und Schwierigkeit
- Schiff navigiert per Klick (Punkt-zu-Punkt)
- Feinde auswählen und mit Kanonen/Harpune angreifen
- 6 Munitionstypen: Iron Ball, Leuchtkugel, Feuerkugel, Sturmkugel, Chain Shot, Grape Shot
- Skill-Bar mit 3 Kampffähigkeiten (Burst, Break, Repair) mit Cooldowns
- Upgrade-System: Rumpf, Segel, Kanonen, Decks, Munitionstechnik
- Gold und Materialien als Ressourcen

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
