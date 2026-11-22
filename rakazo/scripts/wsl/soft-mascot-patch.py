from pathlib import Path
import shutil
root=Path("/home/rakazo/rakazo/app-office")
p=root/"bot-avatar.tsx"
s=p.read_text()
assert "rakazo-friendly-blink" not in s, "Already patched"
shutil.copy2(p,root/"bot-avatar.tsx.before-soft-mascot")
shutil.copy2(root/"styles.css",root/"styles.css.before-soft-mascot")
s=s.replace('  const uid = gradId.replace(/^spin-grad-/, "");\n','')
s=s.replace('  const eyeVariant = seed % 4;\n','')
s=s.replace('` rakazo-eyes-idle-${eyeVariant}`'.replace('` ','`'),'\"rakazo-friendly-blink\"')
s=s.replace('"--rakazo-eye-animation-name": "rakazo-eyes-working"','"--rakazo-eye-animation-name": "rakazo-friendly-blink"')
s=s.replace('"--rakazo-eye-animation-duration": "1.4s"','"--rakazo-eye-animation-duration": "4.8s"')
start=s.index('  const ids = {')
end=s.index('\n\n  return (',start)
s=s[:start]+s[end:]
start=s.index('        <defs>',s.index('className="rakazo-hh-body'))
end=s.index('\n      </svg>',start)
s=s[:start]+'''        <ellipse cx="32" cy="59" rx="18" ry="2" fill="#000000" opacity="0.08" />
        <circle cx="9" cy="38" r="5" fill={lightenColor(color, 30)} />
        <circle cx="55" cy="38" r="5" fill={lightenColor(color, 30)} />
        <rect x="10" y="18" width="44" height="40" rx="20"
          fill="#FFF9ED" stroke={lightenColor(color, 25)} strokeWidth="3" />
        <ellipse cx="20" cy="43" rx="4" ry="2.8" fill="#F2B7AC" opacity="0.8" />
        <ellipse cx="44" cy="43" rx="4" ry="2.8" fill="#F2B7AC" opacity="0.8" />
        {(["idle", "working"] as const).map((mode) => (
          <g key={mode}
            className={` rakazo-bot-avatar-eyes rakazo-bot-avatar-eyes-${mode}`}
            style={mode === "idle" ? idleEyeAnimation : workingEyeAnimation}
            fill="#353C49">
            <ellipse cx="23" cy="36" rx="2.8" ry="3.5" />
            <ellipse cx="41" cy="36" rx="2.8" ry="3.5" />
          </g>
        ))}
        <path className="rakazo-hh-smile" d="M27 44 Q32 50 37 44"
          fill="none" stroke="#353C49" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M14 23 L14 20 C14 3 50 3 50 20 L50 23 Z" fill={hat.top} />
        <rect x="29" y="8" width="6" height="17" rx="3" fill={hat.mid} />
        <rect x="8" y="21" width="48" height="7" rx="3.5" fill={hat.mid} />
        <path d="M17 17 Q19 11 25 10" fill="none" stroke="#FFFFFF"
          strokeOpacity="0.65" strokeWidth="2.5" strokeLinecap="round" />
''' +s[end:]
s=s.replace('function darkenColor(hex: string, percent: number): string {\n  return adjustColor(hex, -percent);\n}\n\n','')
s=s.replace('// CRD: robot avatar redrawn as a 3D-shaded robot wearing a hard hat (civil-engineering style).','// CRD: soft construction buddy with a warm face and a simple rounded hard hat.')
s=s.replace('// Eyes and ring keep the upstream classes/animations; extra motion lives in styles.css (.rakazo-hh-*).','// Preserve working-state ring and reduced-motion support.')
p.write_text(s)
css=root/"styles.css"
t=css.read_text()
t+="""

/* Quiet blink for the soft mascot; existing reduced-motion rules disable it. */
@keyframes rakazo-friendly-blink {
  0%, 43%, 47%, 100% { transform: scaleY(1); }
  45% { transform: scaleY(0.12); }
}
"""
css.write_text(t)
print("Soft mascot applied; previous component and CSS backed up.")
