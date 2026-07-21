export default function BackgroundManager() {
  return (
    <>
      <div className="bg-layer" id="bg-layer" />
      <div className="bg-overlay" />
      <style>{`
        .bg-layer {
          position: fixed; inset: 0; z-index: -50;
          background-image: var(--bg-image); background-size: cover;
          background-position: center; background-attachment: fixed;
        }
        @media (max-width: 767px) {
          .bg-layer { background-attachment: scroll; }
        }
        .bg-overlay {
          position: fixed; inset: 0; z-index: -40;
          background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);
        }
      `}</style>
    </>
  );
}
