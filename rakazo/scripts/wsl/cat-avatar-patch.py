from pathlib import Path
import shutil
from datetime import datetime
root = Path('/home/rakazo/rakazo/app-office')
p = root/'bot-avatar.tsx'
s = p.read_text()
assert 'rakazo-cat-avatar' not in s, 'Cat avatar already installed'
backup = root/('before-cat-avatar-'+datetime.now().strftime('%Y%m%d-%H%M%S'))
backup.mkdir()
for name in ('bot-avatar.tsx', 'Dockerfile'):
    shutil.copy2(root/name, backup/name)
s = s.replace('// CRD: soft construction buddy with a warm face and a simple rounded hard hat.', '// CRD: friendly robot cats with an identity-based role accessory.')
s = s.replace('  const hat = hardHatPalette(color);', '  const role = catRole(identity);')
s = s.replace('"rakazo-bot-avatar rakazo-hh group', '"rakazo-bot-avatar rakazo-cat-avatar rakazo-hh group', 1)
s = s.replace('      data-working={isWorking}\n', '      data-working={isWorking}\n      data-cat-role={role}\n', 1)
start = s.index('        <ellipse cx="32" cy="59"')
end = s.index('\n      </svg>', start)
s = s[:start] + '''        <ellipse cx="32" cy="60" rx="20" ry="2" fill="#000000" opacity="0.10" />
        <path d="M19 59 Q20 49 32 49 Q44 49 45 59" fill={color} stroke="#334155" strokeWidth="1.6" />
        <path d="M28 54 L32 57 L36 54" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        {/* Pointed ears and whiskers keep the cat silhouette readable at 26px. */}
        <path d="M10 29 L8 7 Q8 4 11 6 L27 18 M37 18 L53 6 Q56 4 56 7 L54 29"
          fill="#E8EFF1" stroke="#334155" strokeWidth="2" strokeLinejoin="round" />
        <path d="M13 12 L15 24 L23 20 Z M51 12 L49 24 L41 20 Z" fill={lightenColor(color, 23)} />
        <rect x="8" y="20" width="48" height="34" rx="15" fill="#F6FAFA" stroke="#334155" strokeWidth="2" />
        <path d="M17 24 Q32 19 47 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="6" y="31" width="5" height="13" rx="2.5" fill={color} stroke="#334155" strokeWidth="1.5" />
        <rect x="53" y="31" width="5" height="13" rx="2.5" fill={color} stroke="#334155" strokeWidth="1.5" />
        <ellipse cx="18" cy="43" rx="4" ry="2.5" fill="#F5BFB6" />
        <ellipse cx="46" cy="43" rx="4" ry="2.5" fill="#F5BFB6" />
        {(["idle", "working"] as const).map((mode) => (
          <g key={mode}
            className={`rakazo-bot-avatar-eyes rakazo-bot-avatar-eyes-${mode}`}
            style={mode === "idle" ? idleEyeAnimation : workingEyeAnimation}>
            <rect x="20" y="31" width="6" height="8" rx="3" fill="#263D48" />
            <rect x="38" y="31" width="6" height="8" rx="3" fill="#263D48" />
            <circle cx="22.2" cy="33" r="1" fill="#FFFFFF" />
            <circle cx="40.2" cy="33" r="1" fill="#FFFFFF" />
          </g>
        ))}
        <path d="M29.5 40 L34.5 40 L32 43 Z" fill={color} />
        <path d="M32 43 Q28.5 48 25 44 M32 43 Q35.5 48 39 44"
          fill="none" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15 40 L5 38 M15 45 L5 47 M49 40 L59 38 M49 45 L59 47"
          fill="none" stroke="#627780" strokeWidth="1.5" strokeLinecap="round" />
        {role === "engineer" && (
          <g data-cat-accessory="hard-hat">
            <path d="M17 21 L17 18 C17 4 47 4 47 18 L47 21 Z" fill="#FFFFFF" stroke="#334155" strokeWidth="1.7" />
            <path d="M29 8 L29 20 L35 20 L35 8" fill="#E5EBEE" stroke="#334155" strokeWidth="1.2" />
            <rect x="13" y="19" width="38" height="5" rx="2.5" fill="#FFFFFF" stroke="#334155" strokeWidth="1.7" />
            <circle cx="32" cy="15" r="2.5" fill={color} />
            <rect x="43" y="46" width="17" height="14" rx="3" fill={color} stroke="#334155" strokeWidth="1.5" />
            <path d="M46 56 L46 50 L57 50 M49 50 L49 53 M53 50 L53 54 M57 50 L57 53" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
          </g>
        )}
        {role === "quick" && (
          <g data-cat-accessory="headset-lightning">
            <path d="M13 29 Q12 14 20 13 M44 13 Q52 14 51 29" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
            <rect x="4" y="29" width="8" height="15" rx="3.5" fill={color} stroke="#334155" strokeWidth="1.5" />
            <rect x="52" y="29" width="8" height="15" rx="3.5" fill={color} stroke="#334155" strokeWidth="1.5" />
            <path d="M55 43 Q55 49 43 49" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
            <rect x="39" y="47" width="7" height="4" rx="2" fill="#334155" />
            <circle cx="52" cy="54" r="9" fill={color} stroke="#334155" strokeWidth="1.5" />
            <path d="M53 47 L47 55 L51 55 L50 61 L57 52 L53 52 Z" fill="#FFFFFF" strokeLinejoin="round" />
          </g>
        )}
        {role === "analyst" && (
          <g data-cat-accessory="glasses-magnifier">
            <circle cx="23" cy="35" r="8" fill="none" stroke="#386A76" strokeWidth="1.8" />
            <circle cx="41" cy="35" r="8" fill="none" stroke="#386A76" strokeWidth="1.8" />
            <path d="M31 34 Q32 33 33 34 M10 32 L15 33 M49 33 L54 32" fill="none" stroke="#386A76" strokeWidth="1.8" />
            <path d="M52 52 L60 60" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <circle cx="49" cy="49" r="8.5" fill="#D6F6F0" stroke={color} strokeWidth="3" />
            <path d="M45 52 L45 49 M49 52 L49 46 M53 52 L53 44" stroke="#275E62" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}
        {role === "reviewer" && (
          <g data-cat-accessory="glasses-checklist">
            <rect x="15" y="28" width="15" height="13" rx="4" fill="none" stroke="#6F543A" strokeWidth="2" />
            <rect x="34" y="28" width="15" height="13" rx="4" fill="none" stroke="#6F543A" strokeWidth="2" />
            <path d="M30 32 L34 32 M10 30 L15 31 M49 31 L54 30" fill="none" stroke="#6F543A" strokeWidth="2" />
            <rect x="43" y="43" width="18" height="19" rx="3" fill="#FFFCF4" stroke="#334155" strokeWidth="1.5" />
            <rect x="48" y="41" width="8" height="4" rx="1.5" fill={color} stroke="#334155" strokeWidth="1" />
            <path d="M46 49 L48 51 L51 47 M46 56 L48 58 L51 54" fill="none" stroke="#299C77" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M54 49 L58 49 M54 56 L58 56" stroke="#6F7880" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        )}
''' + s[end:]
start = s.index('/** Hard-hat colours:')
end = s.index('function OrganicAvatar(', start)
s = s[:start] + '''type CatRole = "engineer" | "quick" | "analyst" | "reviewer" | "assistant";

// Use bot identity, not color, so editing a bot's color preserves its role.
function catRole(identity?: string): CatRole {
  switch (identity?.trim().toLowerCase()) {
    case "cmut5h18c000531nvcm72vv0x":
    case "neo":
      return "engineer";
    case "cmutqywdy000431pbt2vp7l8m":
    case "swift":
      return "quick";
    case "cmutcy2c4000431nvq6z5gt3s":
    case "research analyst":
      return "analyst";
    case "cmutd3pxr000g31nvd4ya2q4r":
    case "research reviewer":
      return "reviewer";
    default:
      return "assistant";
  }
}

''' + s[end:]
p.write_text(s)
dockerfile = root/'Dockerfile'
dockerfile.write_text(dockerfile.read_text().replace('# - 3D hard-hat robot avatar (bot-avatar.tsx robot variant + styles.css, generated by avatar-patch.py)', '# - Role-specific robot cat avatars (bot-avatar.tsx robot variant + existing motion styles)'))
print('Robot cats applied. Backup:', backup)