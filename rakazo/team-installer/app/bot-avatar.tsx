import { ACTIVE_RUN_STATUSES, avatarIdentitySeed, organicAvatarPath } from "@rakazo/core";
import { type CSSProperties, memo, useId, useSyncExternalStore } from "react";
import { type AvatarStyle, useAvatarStyle } from "./avatar-style.js";
import { cn } from "./lib/utils.js";
import "./styles.css";

export interface BotAvatarProps {
  color: string;
  size?: number;
  status?: string;
  variant?: AvatarStyle;
  identity?: string;
  className?: string;
}

export const BotAvatar = memo(function BotAvatar({
  color,
  size = 38,
  status,
  variant,
  identity,
  className,
}: BotAvatarProps) {
  const isWorking = ACTIVE_RUN_STATUSES.some((activeStatus) => activeStatus === status);
  const gradId = `spin-grad-${useId().replace(/[^a-zA-Z0-9-_]/g, "")}`;
  const preferredVariant = useAvatarStyle();
  if ((variant ?? preferredVariant) === "organic") {
    return (
      <OrganicAvatar
        color={color}
        identity={identity}
        size={size}
        isWorking={isWorking}
        className={className}
      />
    );
  }
  // CRD: friendly robot cats with an identity-based role accessory.
  // Preserve working-state ring and reduced-motion support.
  const seed = hashString(color || "#8B5CF6");
  const idleDuration = (4.2 + ((seed * 7) % 28) / 10).toFixed(2);
  const idleDelay = (-(((seed * 13) % 45) / 10)).toFixed(2);
  const idleEyeAnimation = {
    "--rakazo-eye-animation-name": "rakazo-friendly-blink",
    "--rakazo-eye-animation-duration": `${idleDuration}s`,
    "--rakazo-eye-animation-easing": "cubic-bezier(0.4, 0, 0.2, 1)",
    "--rakazo-eye-animation-delay": `${idleDelay}s`,
  } as CSSProperties;
  const workingEyeAnimation = {
    "--rakazo-eye-animation-name": "rakazo-friendly-blink",
    "--rakazo-eye-animation-duration": "4.8s",
    "--rakazo-eye-animation-easing": "ease-in-out",
    "--rakazo-eye-animation-delay": "0s",
  } as CSSProperties;
  const role = catRole(identity);


  return (
    <div
      className={cn(
        "rakazo-bot-avatar rakazo-cat-avatar rakazo-hh group relative flex items-center justify-center select-none",
        className,
      )}
      data-working={isWorking}
      data-cat-role={role}
      style={{ width: size, height: size, flex: "none" }}
    >
      <svg
        className="rakazo-bot-avatar-ring absolute pointer-events-none"
        aria-hidden="true"
        style={{
          inset: -4,
          width: size + 8,
          height: size + 8,
          filter: `drop-shadow(0 0 3px ${color})`,
        }}
        viewBox="0 0 48 48"
        fill="none"
      >
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke={`url(#${gradId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="45 80"
        />
        <circle cx="43" cy="24" r="2.8" fill="#ffffff" />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <svg
        className="rakazo-hh-body relative"
        viewBox="0 0 64 64"
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          overflow: "visible",
          filter: isWorking
            ? `drop-shadow(0 0 ${Math.max(2, Math.round(size * 0.18))}px ${color})`
            : `drop-shadow(0 ${Math.max(1, Math.round(size * 0.04))}px ${Math.max(1, Math.round(size * 0.06))}px rgba(0,0,0,0.35))`,
        }}
      >
        <ellipse cx="32" cy="60" rx="20" ry="2" fill="#000000" opacity="0.10" />
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

      </svg>
    </div>
  );
});

type CatRole = "engineer" | "quick" | "analyst" | "reviewer" | "assistant";

// Use bot identity, not color, so editing a bot's color preserves its role.
function catRole(identity?: string): CatRole {
  switch (identity?.trim().toLowerCase()) {
    case "neo":
      return "engineer";
    case "swift":
      return "quick";
    case "research analyst":
      return "analyst";
    case "research reviewer":
      return "reviewer";
    default:
      return "assistant";
  }
}

function OrganicAvatar({
  color,
  identity,
  size,
  isWorking,
  className,
}: {
  color: string;
  identity?: string;
  size: number;
  isWorking: boolean;
  className?: string;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    reducedMotionSnapshot,
    () => false,
  );
  const seed = avatarIdentitySeed(identity || color || "#8B5CF6");
  const duration = `${4.8 + (seed % 24) / 10}s`;
  const shapeA = organicAvatarPath(seed);
  const shapeB = organicAvatarPath(seed, 0.42);

  return (
    <svg
      viewBox="-60 -60 120 120"
      aria-hidden="true"
      className={cn("rakazo-organic-avatar overflow-visible select-none", className)}
      data-working={isWorking}
      data-shape-family={seed % 10}
      data-eye-pattern={seed % 4}
      style={{
        width: size,
        height: size,
        flex: "none",
      }}
    >
      {(["idle", "working"] as const).map((mode) => (
        <path
          key={mode}
          className={`rakazo-organic-avatar-body rakazo-organic-avatar-body-${mode}`}
          d={shapeA}
          fill={color}
          style={
            {
              "--rakazo-organic-path": `path("${shapeA}")`,
              filter:
                mode === "working"
                  ? `drop-shadow(0 0 ${Math.round(size * 0.16)}px ${color})`
                  : "drop-shadow(0 2px 3px rgba(0,0,0,.34))",
            } as CSSProperties
          }
        >
          {!reducedMotion ? (
            <animate
              attributeName="d"
              values={`${shapeA};${shapeB};${shapeA}`}
              dur={duration}
              repeatCount="indefinite"
            />
          ) : null}
        </path>
      ))}
      <g transform={`rotate(${(seed % 9) - 4})`}>
        {(["idle", "working"] as const).map((mode) => (
          <g
            key={mode}
            className={`rakazo-organic-avatar-eyes rakazo-organic-avatar-eyes-${mode}`}
            fill="#101014"
          >
            <rect x="-14" y="-12" width="7" height="24" rx="3.5" />
            <rect x="7" y="-12" width="7" height="24" rx="3.5" />
          </g>
        ))}
      </g>
    </svg>
  );
}

const reducedMotionMedia = "(prefers-reduced-motion: reduce)";

function reducedMotionSnapshot(): boolean {
  return window.matchMedia(reducedMotionMedia).matches;
}

function subscribeToReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia(reducedMotionMedia);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function lightenColor(hex: string, percent: number): string {
  return adjustColor(hex, percent);
}

function adjustColor(hex: string, percent: number): string {
  const clean = hex.replace(/^#/, "");
  if (clean.length !== 6 && clean.length !== 3) return hex;
  const num = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  if (Number.isNaN(num)) return hex;
  let r = (num >> 16) + Math.round((255 * percent) / 100);
  let g = ((num >> 8) & 0x00ff) + Math.round((255 * percent) / 100);
  let b = (num & 0x0000ff) + Math.round((255 * percent) / 100);
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center gap-1.5 rounded-full bg-card">
        <span className="h-4 w-[7px] rounded-full bg-primary" />
        <span className="h-4 w-[7px] rounded-full bg-primary" />
      </div>
      <span className="font-[Aeonik,ui-sans-serif] text-[28px] tracking-tight text-foreground">
        Rakazo
      </span>
    </div>
  );
}
