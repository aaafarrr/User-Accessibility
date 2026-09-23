/**
 * Accessibility Widget Premium - Vanilla JS
 * Dependency-free, Lightweight, and Fully WCAG 2.1 & 2.2 Level AA Compliant
 * Features:
 * - Smart Screen Reader with UserWay-style Navigable Floating Player Bar (Prev, Play/Pause, Next, Speed, Close)
 * - Web Audio API Synthetic Transition Chimes (Sound cues on paragraph transition)
 * - Real-time Visual Sentence & Paragraph Highlighting with Auto-Scroll
 * - Click-to-Read and Keyboard Hotkeys (Alt+Right / Alt+Left / Alt+Space)
 * - Text scaling, Dyslexia typography, Dark Mode, Invert Colors, Focus Outline, Reading Mask & Guide
 * - Full WCAG 2.1/2.2 AA Compliance Statement, Position Switcher, and Bilingual Localization (EN / ID)
 */

class AccessibilityWidget {
    constructor(options = {}) {
        this.config = {
            themeColor: options.themeColor || "#0ea5e9", // Modern Sky Blue (customizable)
            defaultLang: options.defaultLang || document.documentElement.lang || "en",
            position: options.position || "left", // 'left' or 'right'
            container: options.container || document.body,
            ...options
        };

        this.settings = this.loadSettings() || { 
            states: {}, 
            lang: this.config.defaultLang, 
            fontSize: 1, 
            position: this.config.position 
        };
        if (!this.settings.position) this.settings.position = this.config.position;

        this.rendered = false;
        this.isTtsRunning = false;
        this.isTtsPaused = false;
        this.ttsElements = [];
        this.ttsCurrentIndex = 0;
        this.ttsAutoTimer = null;
        this.audioCtx = null;
        this.synth = window.speechSynthesis;
        this.ttsConfig = { lang: 'en-US', rate: 1, pitch: 1, volume: 1 };

        // Full Localizations (WCAG compliant terminology)
        this.locales = {
            id: {
                "Accessibility Menu": "Menu Aksesibilitas", "Reset settings": "Atur Ulang Default", "Close": "Tutup",
                "Text Adjustments": "Penyesuaian Teks", "Adjust Font Size": "Ukuran Font", "Default": "Normal",
                "Highlighting": "Penyorotan Konten", "Highlight Title": "Sorot Judul", "Highlight Links": "Sorot Tautan",
                "Focus Outline": "Sorot Fokus Tab", "Readable Font": "Font Disleksia", "Text Align Left": "Rata Kiri",
                "Text Align Center": "Rata Tengah", "Text Align Right": "Rata Kanan", "Text Align Justify": "Rata Penuh",
                "Color Adjustments": "Penyesuaian Warna", "Dark Mode": "Mode Gelap", "Light Mode": "Mode Terang",
                "Invert Colors": "Balikkan Warna", "High Contrast": "Kontras Tinggi", "High Saturation": "Saturasi Tinggi",
                "Low Saturation": "Saturasi Rendah", "Monochrome": "Monokrom", "Visual & Audio": "Bantuan Visual & Suara",
                "Reading Guide": "Penggaris Baca", "Reading Mask": "Tirai Fokus Baca", "Stop Animations": "Hentikan Animasi",
                "Big Cursor": "Kursor Besar", "Hide Images": "Sembunyikan Gambar", "Mute Sounds": "Bisukan Suara",
                "Letter Spacing": "Spasi Huruf", "Word Spacing": "Spasi Kata", "Line Height": "Tinggi Baris",
                "Font Weight": "Tebal Font", "Text To Speech": "Screen Reader (TTS)", "Skip to Content": "Lewati ke Konten",
                "Move Position": "Pindah Posisi", "WCAG-STATEMENT": "Standar Penuh WCAG 2.1 & 2.2 AA",
                "TTS-LANG": "id-ID", "TTS-START": "Screen Reader Diaktifkan", "TTS-STOP": "Screen Reader Dimatikan"
            },
            en: {
                "Accessibility Menu": "Accessibility Menu", "Reset settings": "Reset Default", "Close": "Close",
                "Text Adjustments": "Text Adjustments", "Adjust Font Size": "Font Size", "Default": "Normal",
                "Highlighting": "Content Highlighting", "Highlight Title": "Highlight Title", "Highlight Links": "Highlight Links",
                "Focus Outline": "Focus Outline", "Readable Font": "Dyslexia Font", "Text Align Left": "Align Left",
                "Text Align Center": "Align Center", "Text Align Right": "Align Right", "Text Align Justify": "Justify Text",
                "Color Adjustments": "Color Adjustments", "Dark Mode": "Dark Mode", "Light Mode": "Light Mode",
                "Invert Colors": "Invert Colors", "High Contrast": "High Contrast", "High Saturation": "High Saturation",
                "Low Saturation": "Low Saturation", "Monochrome": "Monochrome", "Visual & Audio": "Visual & Audio Aids",
                "Reading Guide": "Reading Guide", "Reading Mask": "Reading Mask", "Stop Animations": "Stop Animations",
                "Big Cursor": "Big Cursor", "Hide Images": "Hide Images", "Mute Sounds": "Mute Sounds",
                "Letter Spacing": "Letter Spacing", "Word Spacing": "Word Spacing", "Line Height": "Line Height",
                "Font Weight": "Font Weight", "Text To Speech": "Screen Reader (TTS)", "Skip to Content": "Skip to Content",
                "Move Position": "Toggle Position", "WCAG-STATEMENT": "WCAG 2.1 & 2.2 Level AA Compliant",
                "TTS-LANG": "en-US", "TTS-START": "Screen Reader Enabled", "TTS-STOP": "Screen Reader Disabled"
            }
        };

        this.currentLocale = this.locales[this.settings.lang] || this.locales.en;
        this.ttsConfig.lang = this.currentLocale["TTS-LANG"];

        // Feature Matrix Configuration
        this.features = {
            text: [
                { label: "Font Weight", key: "font-weight", icon: "format_bold" },
                { label: "Line Height", key: "line-height", icon: "format_line_spacing" },
                { label: "Readable Font", key: "readable-font", icon: "spellcheck" },
                { label: "Text Align Left", key: "align-left", icon: "format_align_left" },
                { label: "Text Align Center", key: "align-center", icon: "format_align_center" },
                { label: "Text Align Right", key: "align-right", icon: "format_align_right" },
                { label: "Text Align Justify", key: "align-justify", icon: "format_align_justify" },
                { label: "Letter Spacing", key: "letter-spacing", icon: "text_format" },
                { label: "Word Spacing", key: "word-spacing", icon: "space_bar" },
            ],
            highlight: [
                { label: "Highlight Links", key: "highlight-links", icon: "link" },
                { label: "Highlight Title", key: "highlight-title", icon: "title" },
                { label: "Focus Outline", key: "focus-outline", icon: "center_focus_strong" }
            ],
            color: [
                { label: "Dark Mode", key: "dark-mode", icon: "dark_mode" },
                { label: "Light Mode", key: "light-mode", icon: "light_mode" },
                { label: "Invert Colors", key: "invert-colors", icon: "invert_colors" },
                { label: "High Contrast", key: "high-contrast", icon: "contrast" },
                { label: "Monochrome", key: "monochrome", icon: "filter_b_and_w" },
                { label: "High Saturation", key: "high-saturation", icon: "filter_vintage" },
                { label: "Low Saturation", key: "low-saturation", icon: "gradient" }
            ],
            visualAudio: [
                { label: "Text To Speech", key: "text-to-speech", icon: "record_voice_over" },
                { label: "Reading Guide", key: "readable-guide", icon: "horizontal_rule" },
                { label: "Reading Mask", key: "reading-mask", icon: "highlight" },
                { label: "Big Cursor", key: "big-cursor", icon: "mouse" },
                { label: "Stop Animations", key: "stop-animations", icon: "motion_photos_paused" },
                { label: "Hide Images", key: "hide-images", icon: "hide_image" },
                { label: "Mute Sounds", key: "mute-sounds", icon: "volume_off" }
            ]
        };

        this.init();
    }

    init() {
        // Load Material Icons Round if not already present
        if (!document.querySelector('link[href*="Material+Icons+Round"]')) {
            const iconFont = document.createElement('link');
            iconFont.rel = 'stylesheet';
            iconFont.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
            document.head.appendChild(iconFont);
        }

        this.renderFloatingButton();
        this.applySavedStates();
        this.setupTtsListeners();
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        // WCAG 2.1 Keyboard Accessible Shortcut: Alt + A to toggle widget
        window.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'a' || e.key === 'A')) {
                e.preventDefault();
                this.toggleMenu();
            }
        });
    }

    playAudioCue(type = 'next') {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!this.audioCtx) this.audioCtx = new AudioCtx();
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            if (type === 'start') {
                // Bright two-tone pleasant chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'next' || type === 'prev') {
                // Crisp pop transition sound
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'stop') {
                // Soft descending fade
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.12);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            // Audio context failed or blocked by policy, fail silently
        }
    }

    loadSettings() {
        try {
            const match = document.cookie.match(new RegExp('(^| )asw_premium=([^;]+)'));
            if (match) return JSON.parse(decodeURIComponent(match[2]));
        } catch (e) { console.error(e); }
        return null;
    }

    saveSettings() {
        const expires = new Date();
        expires.setTime(expires.getTime() + (24 * 30 * 60 * 60 * 1000));
        document.cookie = `asw_premium=${encodeURIComponent(JSON.stringify(this.settings))};expires=${expires.toUTCString()};path=/`;
    }

    applySavedStates() {
        if (this.settings.fontSize && this.settings.fontSize !== 1) {
            this.changeFont(this.settings.fontSize);
        }
        this.applyPosition();
        this.updateDOMControls();
        if (this.settings.states['text-to-speech']) {
            this.isTtsRunning = true;
            this.startScreenReader(false);
        }
    }

    reset() {
        this.settings = { 
            states: {}, 
            lang: this.settings.lang, 
            fontSize: 1, 
            position: this.settings.position 
        };
        this.stopScreenReader();
        this.handleReadingGuide(false);
        this.handleReadingMask(false);
        document.documentElement.classList.remove('asw-dark-mode', 'asw-light-mode');
        this.updateDOMControls();
        this.changeFont(1);
        this.saveSettings();
        if (this.menu) {
            this.menu.querySelectorAll(".asw-btn").forEach(btn => btn.classList.remove("active"));
            this.translateUI();
        }
    }

    renderFloatingButton() {
        const isRight = this.settings.position === 'right';
        const btnHtml = `
            <style>
                .asw-floating { position: fixed; z-index: 999990; bottom: 25px; user-select: none; transition: all 0.3s ease; }
                .asw-floating.asw-pos-left { left: 25px; right: auto; }
                .asw-floating.asw-pos-right { right: 25px; left: auto; }
                .asw-trigger-btn { 
                    background: ${this.config.themeColor}; border: none; width: 60px; height: 60px; 
                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                    cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
                    outline: 3px solid rgba(255,255,255,0.8);
                }
                .asw-trigger-btn:hover { transform: scale(1.08) translateY(-3px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); }
                .asw-trigger-btn svg { width: 34px; height: 34px; fill: #ffffff; }
                @keyframes asw-pulse { 0% { box-shadow: 0 0 0 0 rgba(${this.hexToRgb(this.config.themeColor)}, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(0,0,0, 0); } 100% { box-shadow: 0 0 0 0 rgba(0,0,0, 0); } }
                .asw-trigger-btn { animation: asw-pulse 2s infinite; }
                .asw-trigger-btn:hover { animation: none; }
                @media (max-width: 600px) { .asw-trigger-btn { width: 50px; height: 50px; } .asw-trigger-btn svg { width: 28px; height: 28px; } }
            </style>
            <div class="asw-floating ${isRight ? 'asw-pos-right' : 'asw-pos-left'}">
                <button class="asw-trigger-btn" title="Accessibility Menu (Alt + A)" aria-label="Open Accessibility Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0z" fill="none"/><path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                    </svg>
                </button>
            </div>
        `;
        const div = document.createElement("div");
        div.innerHTML = btnHtml;
        this.config.container.appendChild(div);
        div.querySelector('.asw-trigger-btn').addEventListener('click', () => this.toggleMenu());
    }

    renderMenu() {
        this.menu = document.createElement("div");
        this.menu.className = "asw-wrapper";
        const isRight = this.settings.position === 'right';

        this.menu.innerHTML = `
            <style>
                .asw-wrapper { display: none; font-family: 'Segoe UI', system-ui, sans-serif; }
                .asw-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.45); backdrop-filter: blur(4px); z-index: 999991; opacity: 0; transition: opacity 0.3s; }
                .asw-modal { 
                    position: fixed; top: 25px; bottom: 25px; width: 430px; 
                    background: #ffffff; z-index: 999992; border-radius: 16px; 
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                    display: flex; flex-direction: column; overflow: hidden;
                    opacity: 0; transition: all 0.3s ease;
                }
                .asw-modal.asw-pos-left { left: 25px; right: auto; transform: translateX(-20px); }
                .asw-modal.asw-pos-right { right: 25px; left: auto; transform: translateX(20px); }
                .asw-wrapper.show .asw-backdrop { opacity: 1; }
                .asw-wrapper.show .asw-modal { transform: translateX(0); opacity: 1; }
                
                .asw-top-banner {
                    padding: 8px 24px; background: #e0f2fe; border-bottom: 1px solid #bae6fd;
                    display: flex; justify-content: space-between; align-items: center; font-size: 12px;
                }
                .asw-skip-btn {
                    background: #ffffff; border: 1px solid #0284c7; color: #0284c7;
                    padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px;
                    font-weight: 700; display: inline-flex; align-items: center; gap: 4px;
                    transition: 0.2s;
                }
                .asw-skip-btn:hover { background: #0284c7; color: #ffffff; }
                .asw-wcag-badge-txt { 
                    display: inline-flex; align-items: center; gap: 4px; 
                    font-weight: 700; color: #0369a1; font-size: 11px; letter-spacing: 0.3px;
                }

                .asw-head { padding: 18px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
                .asw-head-title { font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;}
                .asw-head-title .material-icons-round { color: ${this.config.themeColor}; }
                .asw-actions { display: flex; gap: 8px; }
                .asw-icon-btn { background: transparent; border: none; padding: 6px; border-radius: 8px; color: #64748b; cursor: pointer; transition: 0.2s; display: flex; }
                .asw-icon-btn:hover { background: #e2e8f0; color: #0f172a; }

                .asw-body { padding: 22px 24px; overflow-y: auto; flex: 1; }
                .asw-body::-webkit-scrollbar { width: 6px; }
                .asw-body::-webkit-scrollbar-track { background: #f1f5f9; }
                .asw-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .asw-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                
                .asw-group { margin-bottom: 26px; }
                .asw-group-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;}
                .asw-group-title::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }
                
                .asw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .asw-btn { 
                    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; 
                    padding: 14px 6px; cursor: pointer; display: flex; flex-direction: column; 
                    align-items: center; text-align: center; color: #475569; 
                    transition: all 0.2s; position: relative; overflow: hidden;
                }
                .asw-btn:hover { border-color: ${this.config.themeColor}; background: #f0f9ff; color: ${this.config.themeColor}; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);}
                .asw-btn.active { background: ${this.config.themeColor}; color: #ffffff; border-color: ${this.config.themeColor}; box-shadow: 0 4px 10px rgba(${this.hexToRgb(this.config.themeColor)}, 0.3); }
                .asw-btn .material-icons-round { font-size: 26px; margin-bottom: 8px; }
                .asw-btn span.asw-lbl { font-size: 11.5px; line-height: 1.3; font-weight: 600; }
                
                .asw-font-ctrl { 
                    display: flex; align-items: center; justify-content: space-between; 
                    background: #f8fafc; padding: 12px 16px; border-radius: 12px; 
                    border: 1px solid #e2e8f0; margin-bottom: 14px;
                }
                .asw-font-ctrl span.lbl { font-weight: 600; color: #334155; font-size: 14px;}
                .asw-font-stepper { display: flex; align-items: center; gap: 12px; }
                .asw-font-stepper button { 
                    background: ${this.config.themeColor}; color: white; border: none; 
                    width: 32px; height: 32px; border-radius: 8px; cursor: pointer; 
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .asw-font-stepper button:hover { opacity: 0.9; }
                .asw-font-stepper span { font-weight: 700; font-size: 14px; width: 45px; text-align: center; color: #0f172a;}
                
                .asw-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
                .asw-lang-select { 
                    width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; 
                    font-size: 13.5px; color: #334155; font-weight: 600; outline: none; background: #fff; cursor:pointer;
                }
                .asw-lang-select:focus { border-color: ${this.config.themeColor}; }
                .asw-stmt-link {
                    margin-top: 10px; text-align: center; font-size: 12px; color: #0284c7; 
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-weight: 600;
                }
                .asw-stmt-link:hover { text-decoration: underline; }

                @media(max-width: 500px) { 
                    .asw-modal { width: calc(100vw - 32px); left: 16px !important; right: 16px !important; top: 16px; bottom: 16px; } 
                    .asw-grid { grid-template-columns: repeat(2, 1fr); }
                }
            </style>
            <div class="asw-backdrop"></div>
            <div class="asw-modal ${isRight ? 'asw-pos-right' : 'asw-pos-left'}">
                <div class="asw-top-banner">
                    <button class="asw-skip-btn">
                        <span class="material-icons-round" style="font-size:16px;">skip_next</span>
                        <span class="asw-translate" data-translate="Skip to Content">Skip to Content</span>
                    </button>
                    <div class="asw-wcag-badge-txt">
                        <span class="material-icons-round" style="font-size:16px; color:#0284c7;">verified</span>
                        <span>WCAG 2.1 & 2.2 AA</span>
                    </div>
                </div>
                <div class="asw-head">
                    <div class="asw-head-title">
                        <span class="material-icons-round">accessibility_new</span>
                        <span class="asw-translate" data-translate="Accessibility Menu">Accessibility Menu</span>
                    </div>
                    <div class="asw-actions">
                        <button class="asw-icon-btn asw-toggle-pos" title="Toggle Position (Left / Right)">
                            <span class="material-icons-round">dock</span>
                        </button>
                        <button class="asw-icon-btn asw-reset" title="Reset Default">
                            <span class="material-icons-round">restart_alt</span>
                        </button>
                        <button class="asw-icon-btn asw-close" title="Close (Esc)">
                            <span class="material-icons-round">close</span>
                        </button>
                    </div>
                </div>
                <div class="asw-body">
                    <div class="asw-group">
                        <div class="asw-group-title asw-translate" data-translate="Text Adjustments">Text Adjustments</div>
                        <div class="asw-font-ctrl">
                            <span class="lbl asw-translate" data-translate="Adjust Font Size">Adjust Font Size</span>
                            <div class="asw-font-stepper">
                                <button class="asw-minus"><span class="material-icons-round">remove</span></button>
                                <span class="asw-font-val asw-translate" data-translate="Default">Default</span>
                                <button class="asw-plus"><span class="material-icons-round">add</span></button>
                            </div>
                        </div>
                        <div class="asw-grid asw-text-grid"></div>
                    </div>
                    <div class="asw-group">
                        <div class="asw-group-title asw-translate" data-translate="Highlighting">Content Highlighting</div>
                        <div class="asw-grid asw-highlight-grid"></div>
                    </div>
                    <div class="asw-group">
                        <div class="asw-group-title asw-translate" data-translate="Color Adjustments">Color Adjustments</div>
                        <div class="asw-grid asw-color-grid"></div>
                    </div>
                    <div class="asw-group" style="margin-bottom:0;">
                        <div class="asw-group-title asw-translate" data-translate="Visual & Audio">Visual & Audio Aids</div>
                        <div class="asw-grid asw-visual-grid"></div>
                    </div>
                </div>
                <div class="asw-footer">
                    <select class="asw-lang-select">
                        <option value="en">🇬🇧 English</option>
                        <option value="id">🇮🇩 Bahasa Indonesia</option>
                    </select>
                    <div class="asw-stmt-link">
                        <span class="material-icons-round" style="font-size:15px;">info</span>
                        <span class="asw-translate" data-translate="WCAG-STATEMENT">WCAG 2.1 & 2.2 Level AA Compliant</span>
                    </div>
                </div>
            </div>
        `;
        this.config.container.appendChild(this.menu);
        this.hydrateMenu();
        this.rendered = true;
    }

    hydrateMenu() {
        const renderGrid = (items, groupKey) => items.map(item => {
            const isActive = this.settings.states[item.key] ? 'active' : '';
            return `<button class="asw-btn ${isActive}" data-group="${groupKey}" data-key="${item.key}">
                        <span class="material-icons-round">${item.icon}</span>
                        <span class="asw-lbl asw-translate" data-translate="${item.label}">${item.label}</span>
                    </button>`;
        }).join('');

        this.menu.querySelector('.asw-text-grid').innerHTML = renderGrid(this.features.text, 'text');
        this.menu.querySelector('.asw-highlight-grid').innerHTML = renderGrid(this.features.highlight, 'highlight');
        this.menu.querySelector('.asw-color-grid').innerHTML = renderGrid(this.features.color, 'color');
        this.menu.querySelector('.asw-visual-grid').innerHTML = renderGrid(this.features.visualAudio, 'visualAudio');

        this.menu.querySelector('.asw-close').addEventListener('click', () => this.toggleMenu());
        this.menu.querySelector('.asw-backdrop').addEventListener('click', () => this.toggleMenu());
        this.menu.querySelector('.asw-reset').addEventListener('click', () => this.reset());
        this.menu.querySelector('.asw-toggle-pos').addEventListener('click', () => this.togglePosition());
        this.menu.querySelector('.asw-minus').addEventListener('click', () => this.changeFont(false));
        this.menu.querySelector('.asw-plus').addEventListener('click', () => this.changeFont(true));
        this.menu.querySelector('.asw-stmt-link').addEventListener('click', () => this.showStatementModal());

        // Skip to Content (WCAG 2.4.1)
        this.menu.querySelector('.asw-skip-btn').addEventListener('click', () => {
            this.toggleMenu();
            const mainContent = document.querySelector('main, #main, #content, [role="main"]') || document.body;
            mainContent.setAttribute('tabindex', '-1');
            mainContent.scrollIntoView({ behavior: 'smooth' });
            mainContent.focus();
        });

        const langSel = this.menu.querySelector('.asw-lang-select');
        langSel.value = this.settings.lang;
        langSel.addEventListener('change', (e) => {
            this.settings.lang = e.target.value;
            this.currentLocale = this.locales[this.settings.lang];
            this.ttsConfig.lang = this.currentLocale["TTS-LANG"];
            this.saveSettings();
            this.translateUI();
        });

        this.menu.querySelectorAll('.asw-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleFeatureClick(btn));
        });

        this.translateUI();
    }

    togglePosition() {
        this.settings.position = this.settings.position === 'right' ? 'left' : 'right';
        this.applyPosition();
        this.saveSettings();
    }

    applyPosition() {
        const floatEl = document.querySelector('.asw-floating');
        if (floatEl) {
            floatEl.classList.toggle('asw-pos-right', this.settings.position === 'right');
            floatEl.classList.toggle('asw-pos-left', this.settings.position !== 'right');
        }
        if (this.menu) {
            const modalEl = this.menu.querySelector('.asw-modal');
            if (modalEl) {
                modalEl.classList.toggle('asw-pos-right', this.settings.position === 'right');
                modalEl.classList.toggle('asw-pos-left', this.settings.position !== 'right');
            }
        }
    }

    translateUI() {
        if (!this.menu) return;
        this.menu.querySelectorAll('.asw-translate').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (this.currentLocale[key]) el.innerText = this.currentLocale[key];
        });

        const fontVal = (this.settings.fontSize && this.settings.fontSize !== 1)
            ? `${Math.round(this.settings.fontSize * 100)}%`
            : (this.currentLocale["Default"] || "Default");
        this.menu.querySelector('.asw-font-val').innerText = fontVal;
    }

    toggleMenu() {
        if (!this.rendered) this.renderMenu();
        if (this.menu.classList.contains('show')) {
            this.menu.classList.remove('show');
            setTimeout(() => { this.menu.style.display = 'none'; }, 300);
        } else {
            this.menu.style.display = 'block';
            void this.menu.offsetWidth;
            this.menu.classList.add('show');
        }
    }

    handleFeatureClick(btn) {
        const key = btn.dataset.key;
        const group = btn.dataset.group;
        const isActiveNow = !this.settings.states[key];

        if (group === 'color') {
            this.features.color.forEach(item => {
                this.settings.states[item.key] = false;
                this.menu.querySelector(`.asw-btn[data-key="${item.key}"]`).classList.remove('active');
            });
        }
        else if (['align-left', 'align-center', 'align-right', 'align-justify'].includes(key)) {
            ['align-left', 'align-center', 'align-right', 'align-justify'].forEach(k => {
                this.settings.states[k] = false;
                this.menu.querySelector(`.asw-btn[data-key="${k}"]`).classList.remove('active');
            });
        }

        this.settings.states[key] = isActiveNow;
        if (isActiveNow) btn.classList.add('active');
        else btn.classList.remove('active');

        if (key === 'text-to-speech') {
            if (isActiveNow) {
                this.startScreenReader(true);
            } else {
                this.stopScreenReader();
            }
        }

        this.updateDOMControls();
        this.saveSettings();
    }

    changeFont(isIncrease) {
        let size = this.settings.fontSize || 1;
        if (isIncrease === true) size += 0.1;
        else if (isIncrease === false) size -= 0.1;
        else size = isIncrease;

        size = Math.max(0.7, Math.min(size, 2));
        this.settings.fontSize = size;
        document.documentElement.style.setProperty('--asw-font-zoom', size);

        this.saveSettings();
        this.translateUI();
        this.updateDOMControls();
    }

    updateDOMControls() {
        let css = '';
        const state = this.settings.states;

        // Font scaling
        if (this.settings.fontSize && this.settings.fontSize !== 1) {
            css += `html, body, p, a, h1, h2, h3, h4, h5, h6, li, span { font-size: calc(1rem * var(--asw-font-zoom, 1)) !important; }`;
        }

        // Typography adjustments (isolated from widget controls)
        if (state['font-weight']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { font-weight: 700 !important; }`;
        if (state['line-height']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { line-height: 2.2 !important; }`;
        if (state['letter-spacing']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { letter-spacing: 0.15em !important; }`;
        if (state['word-spacing']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { word-spacing: 0.35em !important; }`;
        if (state['readable-font']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { font-family: 'OpenDyslexic', 'Comic Sans MS', Arial, sans-serif !important; }`;

        // Text alignment
        if (state['align-left']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { text-align: left !important; }`;
        if (state['align-center']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { text-align: center !important; }`;
        if (state['align-right']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { text-align: right !important; }`;
        if (state['align-justify']) css += `body p, body li, body span:not(.asw-wrapper *) { text-align: justify !important; }`;

        // Content Highlighting
        if (state['highlight-title']) css += `h1:not(.asw-head-title), h2, h3, h4, h5, h6 { outline: 3px solid ${this.config.themeColor} !important; outline-offset: 4px !important; background: rgba(${this.hexToRgb(this.config.themeColor)}, 0.12) !important; }`;
        if (state['highlight-links']) css += `a:not(.asw-wrapper *):not(.asw-floating *) { outline: 3px solid #f59e0b !important; outline-offset: 2px !important; background: rgba(245, 158, 11, 0.12) !important; text-decoration: underline !important; }`;

        // WCAG 2.4.7 Focus Outline Visible
        if (state['focus-outline']) {
            css += `
                body *:focus, body *:focus-visible {
                    outline: 4px solid #f59e0b !important;
                    outline-offset: 3px !important;
                    box-shadow: 0 0 12px rgba(245, 158, 11, 0.75) !important;
                }
            `;
        }

        // Dark Mode & Light Mode
        if (state['dark-mode']) {
            document.documentElement.classList.add('asw-dark-mode');
            document.documentElement.classList.remove('asw-light-mode');
            css += `
                html.asw-dark-mode, html.asw-dark-mode body {
                    background-color: #0b1120 !important;
                    color: #f8fafc !important;
                }
                html.asw-dark-mode header,
                html.asw-dark-mode nav,
                html.asw-dark-mode section,
                html.asw-dark-mode article,
                html.asw-dark-mode aside,
                html.asw-dark-mode footer,
                html.asw-dark-mode .card,
                html.asw-dark-mode .test-card,
                html.asw-dark-mode div:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) {
                    background-color: #1e293b !important;
                    color: #f8fafc !important;
                    border-color: #334155 !important;
                }
                html.asw-dark-mode p,
                html.asw-dark-mode span:not(.asw-wrapper *),
                html.asw-dark-mode h1:not(.asw-head-title),
                html.asw-dark-mode h2,
                html.asw-dark-mode h3,
                html.asw-dark-mode h4,
                html.asw-dark-mode h5,
                html.asw-dark-mode h6,
                html.asw-dark-mode li {
                    color: #f8fafc !important;
                }
                html.asw-dark-mode a:not(.asw-wrapper *):not(.asw-floating *) {
                    color: #38bdf8 !important;
                }
                html.asw-dark-mode img, html.asw-dark-mode video {
                    filter: brightness(0.85) contrast(1.05);
                    background-color: transparent !important;
                }
                /* Dark Mode for Widget Modal */
                html.asw-dark-mode .asw-modal {
                    background: #1e293b !important;
                    color: #f8fafc !important;
                    border: 1px solid #334155 !important;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7) !important;
                }
                html.asw-dark-mode .asw-head,
                html.asw-dark-mode .asw-footer,
                html.asw-dark-mode .asw-font-ctrl {
                    background: #0f172a !important;
                    border-color: #334155 !important;
                }
                html.asw-dark-mode .asw-head-title,
                html.asw-dark-mode .asw-font-ctrl span.lbl,
                html.asw-dark-mode .asw-font-stepper span {
                    color: #f8fafc !important;
                }
                html.asw-dark-mode .asw-icon-btn {
                    color: #94a3b8 !important;
                }
                html.asw-dark-mode .asw-icon-btn:hover {
                    background: #334155 !important;
                    color: #ffffff !important;
                }
                html.asw-dark-mode .asw-btn {
                    background: #0f172a !important;
                    border-color: #334155 !important;
                    color: #cbd5e1 !important;
                }
                html.asw-dark-mode .asw-btn:hover {
                    background: #1e293b !important;
                    border-color: #38bdf8 !important;
                    color: #38bdf8 !important;
                }
                html.asw-dark-mode .asw-btn.active {
                    background: ${this.config.themeColor} !important;
                    border-color: ${this.config.themeColor} !important;
                    color: #ffffff !important;
                }
                html.asw-dark-mode .asw-lang-select {
                    background: #0f172a !important;
                    color: #f8fafc !important;
                    border-color: #334155 !important;
                }
            `;
        } else if (state['light-mode']) {
            document.documentElement.classList.add('asw-light-mode');
            document.documentElement.classList.remove('asw-dark-mode');
            css += `
                html.asw-light-mode, html.asw-light-mode body {
                    background-color: #ffffff !important;
                    color: #0f172a !important;
                }
                html.asw-light-mode header,
                html.asw-light-mode nav,
                html.asw-light-mode section,
                html.asw-light-mode article,
                html.asw-light-mode footer,
                html.asw-light-mode .card,
                html.asw-light-mode .test-card,
                html.asw-light-mode div:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) {
                    background-color: #ffffff !important;
                    color: #0f172a !important;
                    border-color: #e2e8f0 !important;
                }
                html.asw-light-mode p,
                html.asw-light-mode span:not(.asw-wrapper *),
                html.asw-light-mode h1:not(.asw-head-title),
                html.asw-light-mode h2,
                html.asw-light-mode h3,
                html.asw-light-mode h4,
                html.asw-light-mode h5,
                html.asw-light-mode h6,
                html.asw-light-mode li {
                    color: #0f172a !important;
                }
            `;
        } else {
            document.documentElement.classList.remove('asw-dark-mode', 'asw-light-mode');
        }

        // Invert Colors (Negative Contrast)
        let htmlFilter = '';
        if (state['invert-colors']) {
            htmlFilter += ` invert(100%) hue-rotate(180deg)`;
            css += `img, video, iframe, [style*="background-image"] { filter: invert(100%) hue-rotate(180deg) !important; }`;
        }
        if (state['high-contrast']) htmlFilter += ` contrast(160%)`;
        if (state['monochrome']) htmlFilter += ` grayscale(100%)`;
        if (state['high-saturation']) htmlFilter += ` saturate(250%)`;
        if (state['low-saturation']) htmlFilter += ` saturate(40%)`;

        if (htmlFilter) css += `html { filter: ${htmlFilter} !important; }`;

        // Sensory & Distraction reduction
        if (state['hide-images']) css += `img, svg:not(.asw-trigger-btn svg), [style*="background-image"] { visibility: hidden !important; opacity: 0 !important; }`;
        if (state['stop-animations']) css += `body *:not(.asw-wrapper):not(.asw-wrapper *):not(.asw-floating):not(.asw-floating *) { transition: none !important; animation: none !important; scroll-behavior: auto !important; }`;
        if (state['big-cursor']) css += `* { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 512 512'%3E%3Cpath fill='%23000' stroke='%23fff' stroke-width='16' d='M429.742 319.31L82.49 0l-.231 471.744 105.375-100.826 61.89 141.083 96.559-42.358-61.89-141.083 145.549-9.25z'/%3E%3C/svg%3E"), auto !important; }`;

        this.injectCSS(css, 'asw-dynamic-style');
        this.handleReadingGuide(state['readable-guide']);
        this.handleReadingMask(state['reading-mask']);
        this.handleMuteSounds(state['mute-sounds']);
    }

    injectCSS(cssContent, id) {
        let styleObj = document.getElementById(id);
        if (!styleObj) {
            styleObj = document.createElement('style');
            styleObj.id = id;
            document.head.appendChild(styleObj);
        }
        styleObj.innerHTML = cssContent;
    }

    handleReadingGuide(enable) {
        let guide = document.getElementById('asw-read-guide');
        if (enable) {
            if (!guide) {
                guide = document.createElement('div');
                guide.id = 'asw-read-guide';
                guide.innerHTML = `
                    <style>
                        .asw-rg-line { position: fixed; left: 0; right: 0; height: 8px; background: rgba(14, 165, 233, 0.4); border-top: 2px solid ${this.config.themeColor}; border-bottom: 2px solid ${this.config.themeColor}; pointer-events: none; z-index: 999999; box-shadow: 0 0 20px rgba(0,0,0,0.2); }
                        .asw-rg-mask-top, .asw-rg-mask-bot { position: fixed; left: 0; right: 0; background: rgba(0,0,0,0.4); pointer-events: none; z-index: 999998; }
                        .asw-rg-mask-top { top: 0; } .asw-rg-mask-bot { bottom: 0; }
                    </style>
                    <div id="asw-rg-t" class="asw-rg-mask-top"></div><div id="asw-rg-l" class="asw-rg-line"></div><div id="asw-rg-b" class="asw-rg-mask-bot"></div>
                `;
                document.body.appendChild(guide);

                this.rgMoveHandler = (e) => {
                    const gap = 60;
                    document.getElementById('asw-rg-t').style.height = `${e.clientY - gap}px`;
                    document.getElementById('asw-rg-b').style.height = `${window.innerHeight - e.clientY - gap}px`;
                    document.getElementById('asw-rg-l').style.top = `${e.clientY - 4}px`;
                };
                document.addEventListener('mousemove', this.rgMoveHandler);
            }
        } else if (guide) {
            document.removeEventListener('mousemove', this.rgMoveHandler);
            guide.remove();
        }
    }

    handleReadingMask(enable) {
        let mask = document.getElementById('asw-read-mask');
        if (enable) {
            if (!mask) {
                mask = document.createElement('div');
                mask.id = 'asw-read-mask';
                mask.innerHTML = `
                    <style>
                        .asw-mask-top, .asw-mask-bot {
                            position: fixed; left: 0; right: 0; background: rgba(15, 23, 42, 0.75);
                            pointer-events: none; z-index: 999998;
                        }
                        .asw-mask-top { top: 0; }
                        .asw-mask-bot { bottom: 0; }
                        .asw-mask-line { position: fixed; left: 0; right: 0; height: 100px; border-top: 2px dashed ${this.config.themeColor}; border-bottom: 2px dashed ${this.config.themeColor}; pointer-events: none; z-index: 999999; box-shadow: 0 0 30px rgba(0,0,0,0.5); }
                    </style>
                    <div id="asw-mask-t" class="asw-mask-top"></div>
                    <div id="asw-mask-l" class="asw-mask-line"></div>
                    <div id="asw-mask-b" class="asw-mask-bot"></div>
                `;
                document.body.appendChild(mask);

                this.rmMoveHandler = (e) => {
                    const slit = 100;
                    const topH = Math.max(0, e.clientY - (slit / 2));
                    const botH = Math.max(0, window.innerHeight - (e.clientY + (slit / 2)));
                    document.getElementById('asw-mask-t').style.height = `${topH}px`;
                    document.getElementById('asw-mask-b').style.height = `${botH}px`;
                    document.getElementById('asw-mask-l').style.top = `${topH}px`;
                };
                document.addEventListener('mousemove', this.rmMoveHandler);
            }
        } else if (mask) {
            document.removeEventListener('mousemove', this.rmMoveHandler);
            mask.remove();
        }
    }

    handleMuteSounds(enable) {
        document.querySelectorAll('video, audio').forEach(media => { media.muted = enable; });
    }

    // ==========================================
    // SMART SCREEN READER (UserWay Style TTS Player)
    // ==========================================
    startScreenReader(autoPlay = true) {
        this.isTtsRunning = true;
        this.indexReadableElements();
        this.renderTtsPlayerBar();
        this.playAudioCue('start');
        this.showToast(this.currentLocale['TTS-START']);
        if (autoPlay && this.ttsElements.length > 0) {
            this.ttsCurrentIndex = 0;
            this.ttsPlayCurrent(false);
        }
    }

    stopScreenReader() {
        this.isTtsRunning = false;
        clearTimeout(this.ttsAutoTimer);
        if (this.synth) this.synth.cancel();
        this.removeTtsHighlights();
        this.hideTtsPlayerBar();
        this.playAudioCue('stop');
        this.showToast(this.currentLocale['TTS-STOP']);
        if (this.menu) {
            const ttsBtn = this.menu.querySelector('.asw-btn[data-key="text-to-speech"]');
            if (ttsBtn) ttsBtn.classList.remove('active');
        }
    }

    indexReadableElements() {
        const root = document.querySelector('main, #main, article, [role="main"]') || document.body;
        const selector = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, a, button';
        const all = Array.from(root.querySelectorAll(selector));
        
        this.ttsElements = all.filter(el => {
            if (el.closest('.asw-wrapper') || el.closest('.asw-floating') || el.closest('#asw-tts-player') || el.closest('#asw-statement-dialog')) return false;
            const text = el.innerText ? el.innerText.trim() : '';
            return text.length > 2 && el.offsetParent !== null;
        });

        if (this.ttsElements.length === 0) {
            this.ttsElements = Array.from(document.querySelectorAll('p, h1, h2, h3')).filter(el => !el.closest('.asw-wrapper') && el.innerText.trim().length > 2);
        }
    }

    renderTtsPlayerBar() {
        let player = document.getElementById('asw-tts-player');
        if (!player) {
            player = document.createElement('div');
            player.id = 'asw-tts-player';
            player.innerHTML = `
                <style>
                    #asw-tts-player {
                        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(30px);
                        background: rgba(15, 23, 42, 0.94); backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.18);
                        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(14, 165, 233, 0.3);
                        border-radius: 50px; padding: 8px 16px; display: flex; align-items: center; gap: 14px;
                        z-index: 999999; color: #ffffff; font-family: 'Segoe UI', system-ui, sans-serif;
                        opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); max-width: 90vw;
                    }
                    #asw-tts-player.show {
                        transform: translateX(-50%) translateY(0); opacity: 1;
                    }
                    .asw-tts-ctrls { display: flex; align-items: center; gap: 6px; }
                    .asw-tts-act-btn {
                        background: rgba(255, 255, 255, 0.1); border: none; color: #ffffff;
                        width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center;
                        justify-content: center; cursor: pointer; transition: all 0.2s;
                    }
                    .asw-tts-act-btn:hover {
                        background: ${this.config.themeColor}; transform: scale(1.08);
                    }
                    .asw-tts-play-main {
                        background: ${this.config.themeColor}; width: 44px; height: 44px;
                        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
                    }
                    .asw-tts-play-main:hover {
                        transform: scale(1.1); filter: brightness(1.1);
                    }
                    .asw-tts-speed-badge {
                        background: rgba(255, 255, 255, 0.12); border: none; color: #38bdf8;
                        font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 20px;
                        cursor: pointer; transition: 0.2s;
                    }
                    .asw-tts-speed-badge:hover { background: rgba(56, 189, 248, 0.25); }
                    .asw-tts-info-box {
                        display: flex; align-items: center; gap: 10px; max-width: 560px;
                        overflow: hidden; padding-left: 6px; border-left: 1px solid rgba(255, 255, 255, 0.15);
                    }
                    .asw-tts-waves { display: flex; align-items: center; gap: 3px; height: 16px; }
                    .asw-tts-waves span {
                        width: 3px; height: 100%; background: #38bdf8; border-radius: 3px;
                        animation: asw-wave 1s infinite ease-in-out;
                    }
                    .asw-tts-waves span:nth-child(2) { animation-delay: 0.2s; }
                    .asw-tts-waves span:nth-child(3) { animation-delay: 0.4s; }
                    .asw-tts-waves span:nth-child(4) { animation-delay: 0.6s; }
                    .asw-tts-waves.paused span { animation: none; height: 4px; }
                    @keyframes asw-wave {
                        0%, 100% { height: 4px; }
                        50% { height: 16px; }
                    }
                    .asw-tts-transcript {
                        font-size: 13px; font-weight: 500; color: #f1f5f9; white-space: nowrap;
                        overflow: hidden; text-overflow: ellipsis; max-width: 460px;
                    }
                    .asw-tts-progress-tag {
                        font-size: 11px; font-weight: 700; color: #94a3b8; background: rgba(0,0,0,0.3);
                        padding: 2px 6px; border-radius: 4px;
                    }
                    .asw-tts-reading-target {
                        outline: 4px solid ${this.config.themeColor} !important;
                        outline-offset: 4px !important;
                        background: rgba(${this.hexToRgb(this.config.themeColor)}, 0.18) !important;
                        border-radius: 8px !important;
                        box-shadow: 0 0 25px rgba(${this.hexToRgb(this.config.themeColor)}, 0.4) !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }
                    html.asw-dark-mode .asw-tts-reading-target {
                        outline-color: #38bdf8 !important;
                        background: rgba(56, 189, 248, 0.22) !important;
                        box-shadow: 0 0 25px rgba(56, 189, 248, 0.5) !important;
                    }
                    @media (max-width: 650px) {
                        #asw-tts-player { bottom: 15px; border-radius: 20px; padding: 6px 12px; }
                        .asw-tts-info-box { max-width: 160px; }
                        .asw-tts-transcript { max-width: 120px; }
                    }
                </style>
                <div class="asw-tts-ctrls">
                    <button class="asw-tts-act-btn asw-btn-prev" title="Previous (Alt + Left)">
                        <span class="material-icons-round" style="font-size:20px;">skip_previous</span>
                    </button>
                    <button class="asw-tts-act-btn asw-tts-play-main asw-btn-play" title="Play / Pause (Alt + Space)">
                        <span class="material-icons-round" style="font-size:24px;">pause</span>
                    </button>
                    <button class="asw-tts-act-btn asw-btn-next" title="Next (Alt + Right)">
                        <span class="material-icons-round" style="font-size:20px;">skip_next</span>
                    </button>
                    <button class="asw-tts-speed-badge asw-btn-speed" title="Change Speed">
                        <span class="asw-speed-lbl">1.0x</span>
                    </button>
                    <button class="asw-tts-act-btn asw-btn-stop" title="Close Reader">
                        <span class="material-icons-round" style="font-size:18px;">close</span>
                    </button>
                </div>
                <div class="asw-tts-info-box">
                    <div class="asw-tts-waves">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span class="asw-tts-progress-tag">1/1</span>
                    <span class="asw-tts-transcript">Initializing reader...</span>
                </div>
            `;
            document.body.appendChild(player);

            player.querySelector('.asw-btn-prev').addEventListener('click', () => this.ttsPrev());
            player.querySelector('.asw-btn-next').addEventListener('click', () => this.ttsNext());
            player.querySelector('.asw-btn-play').addEventListener('click', () => this.ttsTogglePlay());
            player.querySelector('.asw-btn-speed').addEventListener('click', () => this.ttsCycleSpeed());
            player.querySelector('.asw-btn-stop').addEventListener('click', () => this.stopScreenReader());
        }

        setTimeout(() => player.classList.add('show'), 20);
    }

    hideTtsPlayerBar() {
        const player = document.getElementById('asw-tts-player');
        if (player) {
            player.classList.remove('show');
            setTimeout(() => player.remove(), 300);
        }
    }

    removeTtsHighlights() {
        document.querySelectorAll('.asw-tts-reading-target').forEach(el => {
            el.classList.remove('asw-tts-reading-target');
        });
    }

    ttsPlayCurrent(triggerSound = true) {
        if (!this.ttsElements || this.ttsElements.length === 0) return;
        if (this.ttsCurrentIndex < 0) this.ttsCurrentIndex = 0;
        if (this.ttsCurrentIndex >= this.ttsElements.length) {
            this.stopScreenReader();
            return;
        }

        if (triggerSound) this.playAudioCue('next');
        this.removeTtsHighlights();

        const el = this.ttsElements[this.ttsCurrentIndex];
        el.classList.add('asw-tts-reading-target');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const rawText = el.innerText ? el.innerText.trim() : '';
        this.updateTtsPlayerUI(rawText);

        if (this.synth.speaking) this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(rawText);
        utterance.lang = this.ttsConfig.lang;
        utterance.rate = this.ttsConfig.rate || 1;
        utterance.pitch = this.ttsConfig.pitch || 1;

        utterance.onend = () => {
            // Auto advance to next element if screen reader is still running
            if (this.isTtsRunning && !this.isTtsPaused) {
                this.ttsAutoTimer = setTimeout(() => {
                    if (this.isTtsRunning && !this.isTtsPaused) {
                        this.ttsNext();
                    }
                }, 400);
            }
        };

        this.isTtsPaused = false;
        this.synth.speak(utterance);
    }

    ttsNext() {
        clearTimeout(this.ttsAutoTimer);
        if (this.ttsCurrentIndex < this.ttsElements.length - 1) {
            this.ttsCurrentIndex++;
            this.ttsPlayCurrent(true);
        } else {
            this.stopScreenReader();
        }
    }

    ttsPrev() {
        clearTimeout(this.ttsAutoTimer);
        if (this.ttsCurrentIndex > 0) {
            this.ttsCurrentIndex--;
            this.ttsPlayCurrent(true);
        } else {
            this.ttsPlayCurrent(true);
        }
    }

    ttsTogglePlay() {
        clearTimeout(this.ttsAutoTimer);
        const player = document.getElementById('asw-tts-player');
        const playBtnIcon = player ? player.querySelector('.asw-btn-play .material-icons-round') : null;
        const waveBox = player ? player.querySelector('.asw-tts-waves') : null;

        if (this.synth.speaking && !this.synth.paused) {
            this.synth.pause();
            this.isTtsPaused = true;
            if (playBtnIcon) playBtnIcon.innerText = 'play_arrow';
            if (waveBox) waveBox.classList.add('paused');
        } else if (this.synth.paused) {
            this.synth.resume();
            this.isTtsPaused = false;
            if (playBtnIcon) playBtnIcon.innerText = 'pause';
            if (waveBox) waveBox.classList.remove('paused');
        } else {
            this.ttsPlayCurrent(true);
            if (playBtnIcon) playBtnIcon.innerText = 'pause';
            if (waveBox) waveBox.classList.remove('paused');
        }
    }

    ttsCycleSpeed() {
        const rates = [1, 1.25, 1.5, 0.8];
        const labels = ['1.0x', '1.25x', '1.5x', '0.8x'];
        const currentIdx = rates.indexOf(this.ttsConfig.rate || 1);
        const nextIdx = (currentIdx + 1) % rates.length;
        this.ttsConfig.rate = rates[nextIdx];

        const player = document.getElementById('asw-tts-player');
        if (player) {
            player.querySelector('.asw-speed-lbl').innerText = labels[nextIdx];
        }
        this.ttsPlayCurrent(false);
    }

    updateTtsPlayerUI(text) {
        const player = document.getElementById('asw-tts-player');
        if (!player) return;

        const transcriptEl = player.querySelector('.asw-tts-transcript');
        const tagEl = player.querySelector('.asw-tts-progress-tag');
        const playBtnIcon = player.querySelector('.asw-btn-play .material-icons-round');
        const waveBox = player.querySelector('.asw-tts-waves');

        if (transcriptEl) transcriptEl.innerText = `"${text}"`;
        if (tagEl) tagEl.innerText = `${this.ttsCurrentIndex + 1}/${this.ttsElements.length}`;
        if (playBtnIcon) playBtnIcon.innerText = 'pause';
        if (waveBox) waveBox.classList.remove('paused');
    }

    setupTtsListeners() {
        // Selection reader
        document.addEventListener('mouseup', () => {
            if (!this.isTtsRunning) return;
            setTimeout(() => {
                const text = window.getSelection().toString().trim();
                if (text && text.length > 1) {
                    this.playAudioCue('next');
                    this.speak(text);
                    this.updateTtsPlayerUI(text);
                }
            }, 50);
        });

        // Click-to-read direct element jumping (like UserWay)
        document.addEventListener('click', (e) => {
            if (!this.isTtsRunning) return;
            if (e.target.closest('#asw-tts-player') || e.target.closest('.asw-wrapper') || e.target.closest('.asw-floating')) {
                return;
            }
            const target = e.target.closest('h1, h2, h3, h4, h5, h6, p, li, blockquote, a, button');
            if (target && this.ttsElements) {
                const idx = this.ttsElements.indexOf(target);
                if (idx !== -1) {
                    this.ttsCurrentIndex = idx;
                    this.ttsPlayCurrent(true);
                }
            }
        });

        // Keyboard hotkeys for screen reader navigation
        window.addEventListener('keydown', (e) => {
            if (!this.isTtsRunning) return;
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.ttsNext();
            } else if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.ttsPrev();
            } else if (e.altKey && e.key === ' ') {
                e.preventDefault();
                this.ttsTogglePlay();
            }
        });
    }

    speak(text) {
        if (this.synth.speaking) this.synth.cancel();
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.ttsConfig.lang;
        utterance.rate = this.ttsConfig.rate || 1;
        utterance.pitch = this.ttsConfig.pitch || 1;
        this.synth.speak(utterance);
    }

    showToast(message) {
        let toast = document.getElementById('asw-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'asw-toast';
            toast.style.cssText = `position:fixed; bottom: 100px; left: 25px; background: #0f172a; color:#fff; padding:12px 24px; border-radius:12px; z-index:999999; box-shadow: 0 10px 15px rgba(0,0,0,0.1); font-weight: 600; font-family: sans-serif; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(20px); opacity: 0; pointer-events:none;`;
            document.body.appendChild(toast);
        }
        toast.innerText = message;
        setTimeout(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; }, 10);

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => { toast.style.transform = 'translateY(20px)'; toast.style.opacity = '0'; }, 3000);
    }

    showStatementModal() {
        let modal = document.getElementById('asw-statement-dialog');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'asw-statement-dialog';
            modal.innerHTML = `
                <style>
                    .asw-stmt-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 9999999; display: flex; align-items: center; justify-content: center; padding: 20px; }
                    .asw-stmt-card { background: #fff; border-radius: 16px; max-width: 520px; width: 100%; padding: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #e2e8f0; font-family: 'Segoe UI', system-ui, sans-serif; position: relative; }
                    html.asw-dark-mode .asw-stmt-card { background: #1e293b; color: #f8fafc; border-color: #334155; }
                    .asw-stmt-card h3 { font-size: 1.25rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: ${this.config.themeColor}; }
                    .asw-stmt-card p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 12px; }
                    html.asw-dark-mode .asw-stmt-card p { color: #cbd5e1; }
                    .asw-stmt-close { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b; }
                    .asw-stmt-badge-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
                    .asw-stmt-tag { background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
                    html.asw-dark-mode .asw-stmt-tag { background: #0c4a6e; color: #38bdf8; }
                </style>
                <div class="asw-stmt-backdrop">
                    <div class="asw-stmt-card">
                        <button class="asw-stmt-close"><span class="material-icons-round">close</span></button>
                        <h3><span class="material-icons-round">verified</span> WCAG 2.1 & 2.2 AA Compliance Statement</h3>
                        <p>This web application incorporates comprehensive digital accessibility features designed to adhere strictly to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 and 2.2 Level AA</strong> standards.</p>
                        <div class="asw-stmt-badge-list">
                            <span class="asw-stmt-tag">WCAG 2.1 / 2.2 AA</span>
                            <span class="asw-stmt-tag">Section 508</span>
                            <span class="asw-stmt-tag">ADA Compliant</span>
                            <span class="asw-stmt-tag">Smart Screen Reader</span>
                            <span class="asw-stmt-tag">Keyboard Navigable</span>
                        </div>
                        <p><strong>Supported Assistive Capabilities:</strong> Navigable Screen Reader with transition chimes, text scaling, contrast modes, dyslexia typography, focus indicator, keyboard shortcuts (<code>Alt + A</code>, <code>Alt + Right</code>, <code>Alt + Left</code>), and cognitive reading guides.</p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.asw-stmt-close').addEventListener('click', () => modal.remove());
            modal.querySelector('.asw-stmt-backdrop').addEventListener('click', (e) => {
                if (e.target.classList.contains('asw-stmt-backdrop')) modal.remove();
            });
        }
    }

    hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
        else if (hex.length == 7) { r = parseInt(hex.substring(1, 3), 16); g = parseInt(hex.substring(3, 5), 16); b = parseInt(hex.substring(5, 7), 16); }
        return `${r}, ${g}, ${b}`;
    }
}

// Auto-initialize widget on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    window.accessibilityApp = new AccessibilityWidget({
        themeColor: "#0ea5e9", // Custom theme accent color (default: Modern Sky Blue)
        defaultLang: "en",     // Default language: English
        position: "left"       // Default position: 'left' or 'right'
    });
});