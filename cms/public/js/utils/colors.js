export function hexToHsl(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function generateThemeColors(baseColorHex) {
    const [h, s, l] = hexToHsl(baseColorHex);
    // Complementary hue: opposite side of the color wheel
    const hComp = (h + 180) % 360;
    // Near-achromatic saturation for neutral surfaces (background, muted, border, card)
    const bgS = Math.min(s, 5);
    // Moderate saturation for secondary (complementary) color
    const secS = Math.max(35, Math.min(s, 60));
    // Reduced saturation for light-mode primary (softer, less vivid)
    const lightPriS = Math.round(s * 0.65);
    return {
        baseColor: baseColorHex,
        light: {
            primary: hslToHex(h, lightPriS, Math.max(22, l - 12)),
            secondary: hslToHex(hComp, secS, 36),
            background: hslToHex(h, bgS, 97),
            foreground: hslToHex(h, bgS, 11),
            muted: hslToHex(h, bgS, 48),
            border: hslToHex(h, bgS, 85),
            card: hslToHex(h, bgS, 94),

        },
        dark: {
            // Dark primary: reduced saturation (×0.7) to avoid harshness
            primary: hslToHex(h, Math.round(s * 0.7), Math.min(70, l + 12)),
            // Dark secondary: slightly desaturated complementary
            secondary: hslToHex(hComp, Math.round(secS * 0.85), 60),
            // Charcoal gray background — near-zero hue influence
            background: hslToHex(h, bgS, 9),
            foreground: hslToHex(h, bgS, 94),
            // Muted: neutral mid-gray, clearly lighter than background
            muted: hslToHex(h, bgS, 54),
            // Border: neutral dark-gray
            border: hslToHex(h, bgS, 21),
            card: hslToHex(h, bgS, 12),

        }
    };
}
