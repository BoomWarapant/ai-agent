from pathlib import Path
import shutil, sys
root = Path(sys.argv[1])
a, c = root/"bot-avatar.tsx", root/"styles.css"
s, css = a.read_text(), c.read_text()
def rep(text, old, new):
    assert text.count(old)==1, old
    return text.replace(old,new,1)
changes=[
('drop-shadow(0 0 6px ${color}) drop-shadow(0 0 10px #ffffff)','drop-shadow(0 0 3px ${color})'),
('offset="0.55" stopColor={color}', 'offset="0.55" stopColor={lightenColor(color, 12)}'),
('darkenColor(color, 35)', 'darkenColor(color, 12)'),
('x="15.5"\n          y="35"\n          width="33"\n          height="17"\n          rx="8.5"','x="12"\n          y="29"\n          width="40"\n          height="26"\n          rx="12"'),
('<rect x="19" y="36.5" width="20" height="2.2" rx="1.1" fill="#ffffff" opacity="0.12" />','<path d="M19 32 Q32 29 45 32" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" fill="none" />'),
('<rect x="23" y="39" width="5" height="9" rx="2.5" />','<rect x="22" y="34" width="6" height="8" rx="3" />'),
('<rect x="36" y="39" width="5" height="9" rx="2.5" />','<rect x="36" y="34" width="6" height="8" rx="3" />'),
('        <ellipse cx="32" cy="27.5"', '''        <path className="rakazo-hh-smile" d="M28 46 Q32 50 36 46" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" />
        <ellipse cx="19.5" cy="44" rx="3" ry="1.8" fill={hat.top} opacity="0.55" />
        <ellipse cx="44.5" cy="44" rx="3" ry="1.8" fill={hat.top} opacity="0.55" />
        <ellipse cx="32" cy="27.5"'''),
('className="rakazo-bot-avatar-ring absolute pointer-events-none"\n','className="rakazo-bot-avatar-ring absolute pointer-events-none"\n        aria-hidden="true"\n')]
for old,new in changes: s=rep(s,old,new)
for old,new in [
('  animation: rakazo-hh-bob 3.6s ease-in-out infinite;\n',''),
('  transform: rotateY(-18deg) rotateX(8deg);','  transform: rotate(-6deg) translateY(-1px);'),
('  animation-duration: 1.2s;','  animation: rakazo-hh-bob 2.8s ease-in-out infinite;'),
('  animation: rakazo-hh-lamp 1s ease-in-out infinite;','  animation: rakazo-hh-lamp 2.8s ease-in-out infinite;'),
('    translate: 0 -5%;','    translate: 0 -3%;'),
('  .rakazo-hh-body,\n  .rakazo-hh-lamp {','  .rakazo-hh-body,\n  .rakazo-hh-lamp,\n  .rakazo-bot-avatar[data-working="true"] .rakazo-hh-body,\n  .rakazo-bot-avatar[data-working="true"] .rakazo-hh-lamp {')
]: css=rep(css,old,new)
for f in (a,c):
    assert not f.with_suffix(f.suffix+".before-friendly").exists()
for f in (a,c): shutil.copy2(f,f.with_suffix(f.suffix+".before-friendly"))
a.write_text(s)
c.write_text(css)
print("Friendly avatar applied; original files backed up.")
