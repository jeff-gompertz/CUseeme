# CUSeeMe Modular — Continuity Manifest v1.0
_Last synchronized: 2025-11-05_

## Purpose
This document preserves the full architectural state of the CUSeeMe Modular system — ensuring continuity between sessions and collaborators without needing prior chat context.

---

## 🔧 System Architecture
**Core Path:** `/CUseeme/A/`

### CSS
| File | Role |
|------|------|
| **global.css** | Basic resets + font baseline |
| **theme_base.css** | White background, light haze, neutral palette |
| **theme_armature_v1.0.css** | Viewport math & positioning grid |
| **hud_theme_aqua_retro.css** | Current active HUD theme (Retro4.4 Aqua Glass) |
| **hud_base.css** | Neutral HUD structural layer |
| **neumorphic.css** | Experimental soft-UI variant |
| **shell_theme_cuseeme_classic.css** | Legacy shell variant |
| **shell_theme_retro4.5.css** | Alternate retro HUD shell |
| **modules/hud_shell.html** | Shared reusable HUD block |
| **modules/placeholder.html** | Placeholder / testing element |

---

### JavaScript
| File | Role |
|------|------|
| **core.js** | Shared base functions |
| **hud_core.js** | HUD position + armature consistency |
| **hud_logic.js** | Main HUD interactivity (Mic, Voice, Next) |
| **voice.js** | Text-to-speech and recognition engine |
| **semantic.js** | Text + BBC feed reactive blending |
| **ticker.js** | Text ticker and scrolling feed logic |
| **video_ratio.js** | Portrait video scaling (TikTok / IG format) |
| **miniwindows.js** | Draggable mini-window system |
| **wpfeed.js** | WordPress REST/JSON data feed |
| **V1blooplesemantic.js** | Legacy prototype semantic core |
| **placeholder.html** | Script testing space |

---

## 🧩 HTML Scenes
| File | Function |
|------|-----------|
| **index.html** | Semantic feed + BBC reactive |
| **video_scene1_.html** | Live rear camera, HUD active (portrait) |
| **video_scene2_.html** | Second video variant |
| *(future)* `recursion.html`, `network.html` | Planned expansion scenes |

---

## 🎨 Design Consistency
The HUD design and positioning are defined by three main layers:
1. `/css/theme_base.css` — global color, white haze  
2. `/css/theme_armature_v1.0.css` — viewport math and grid  
3. `/css/hud_theme_aqua_retro.css` — active HUD skin  

Each page should load them identically:
```html
<link rel="stylesheet" href="css/theme_base.css">
<link rel="stylesheet" href="css/theme_armature_v1.0.css">
<link rel="stylesheet" href="css/hud_theme_aqua_retro.css">
<script src="js/hud_logic.js"></script>

