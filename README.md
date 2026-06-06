# 🌡️ Thermostat Card

Eine Lovelace-Karte für Home Assistant im Glasmorphism-Stil für Thermostate und Klimaanlagen. Zeigt Ist- und Solltemperatur, den aktuellen HVAC-Modus und ermöglicht das direkte Einstellen per Schieberegler und Modus-Buttons.

## ✨ Features

- **Ist/Soll-Temperatur** – beide Werte auf einen Blick, immer mit einer Nachkommastelle
- **Modus-Buttons** – alle vom Gerät unterstützten HVAC-Modi (Heizen, Kühlen, Auto, Aus …) direkt umschaltbar
- **Temperatur-Schieberegler** – Solltemperatur stufenlos einstellen, Live-Vorschau während des Ziehens
- **Aktiv-Badge** – zeigt an wenn die Anlage gerade heizt oder kühlt
- **Akzentfarbe** – wechselt automatisch (Orange = heizt, Blau = kühlt)
- **Script-Button** – optionaler Button zum Umschalten zwischen Heizen und Kühlen (z. B. Wärmepumpe)
- **Visueller Editor** – alles per Maske einstellbar, kein YAML nötig
- **Glasmorphism-Design** – passend zu den anderen Widgets

## 📦 Installation

### Über HACS (empfohlen)

1. HACS → Frontend → ⋮ → **Custom Repositories**
2. URL: `https://github.com/pquandel2-alt/pq_thermostat_card` → Typ: **Lovelace**
3. Installieren und Seite neu laden

### Manuell

1. `thermostat-card.js` nach `/config/www/` kopieren
2. In `configuration.yaml` unter `lovelace → resources` eintragen:
   ```yaml
   resources:
     - url: /local/thermostat-card.js
       type: module
   ```

## ⚙️ Konfiguration

### Über den visuellen Editor (empfohlen)

1. Karte hinzufügen → **Thermostat Card** auswählen
2. **Klimaentität** auswählen (z. B. `climate.wohnzimmer`)
3. Optional: **Script-Entität** für den Heizen/Kühlen-Umschalter
4. Optional: **Script-Bezeichnung** für den Button-Text

### Per YAML

#### Minimal

```yaml
type: custom:thermostat-card
entity: climate.wohnzimmer
```

#### Mit Script-Button

```yaml
type: custom:thermostat-card
entity: climate.wohnzimmer
name: Wohnzimmer
script_entity: script.waermepumpe_modus_wechseln
script_name: Heizen ↔ Kühlen
```

#### Vollständig

```yaml
type: custom:thermostat-card
entity: climate.wohnzimmer
name: Wohnzimmer
script_entity: script.waermepumpe_modus_wechseln
script_name: Heizen ↔ Kühlen
border_radius: 16
```

## 🔧 Optionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `entity` | string | – | Klimaentität (`climate.*`) |
| `name` | string | Friendly Name | Anzeigename |
| `script_entity` | string | – | Script-Entität für den Heizen/Kühlen-Umschalter (`script.*`) |
| `script_name` | string | `Heizen ↔ Kühlen` | Beschriftung des Script-Buttons |
| `border_radius` | number | `16` | Eckenradius in px |

## 🌡️ HVAC-Modi

Die angezeigten Modus-Buttons richten sich nach dem `hvac_modes`-Attribut der Klimaentität und werden automatisch aus dem Gerät übernommen:

| Modus | Deutsch | Icon |
|---|---|---|
| `off` | Aus | Power |
| `heat` | Heizen | Feuer |
| `cool` | Kühlen | Schneeflocke |
| `auto` | Auto | Thermostat |
| `heat_cool` | Heizen/Kühlen | Thermometer |
| `fan_only` | Lüften | Ventilator |
| `dry` | Entfeuchten | Wassertropfen |

## 🔗 Verwandte Projekte

- [Washer Card](https://github.com/pquandel2-alt/pq_washer_card) – Waschmaschinen- & Trockner-Widget im gleichen Glasstil
- [Energy Card](https://github.com/pquandel2-alt/pq_energy_card) – Stromverbrauch im gleichen Glasstil
- [Glass Button Card](https://github.com/pquandel2-alt/pq_glass-button-card) – Konfigurierbarer Button im gleichen Glasstil
- [Battery Card](https://github.com/pquandel2-alt/pq_battery_card) – Batteriestände im gleichen Glasstil
- [Room Overview Card](https://github.com/pquandel2-alt/pq_room_overview_card) – Raumübersicht im gleichen Glasstil
