/** Shared "P" monogram used by the generated app icons (app/icon.tsx, app/apple-icon.tsx). */
export function Monogram({ size, radius }: { size: number; radius: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        background: "radial-gradient(circle at 50% 25%, #2a241e 0%, #0c0c0f 70%)",
      }}
    >
      <div
        style={{
          width: size * 0.72,
          height: size * 0.72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9999,
          border: `${Math.max(2, size * 0.012)}px solid rgba(201,168,120,0.55)`,
          color: "#c9a878",
          fontSize: size * 0.46,
          fontFamily: "serif",
          fontStyle: "italic",
          paddingBottom: size * 0.03,
        }}
      >
        P
      </div>
    </div>
  );
}
