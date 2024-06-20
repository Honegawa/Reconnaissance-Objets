import "../styles/Canvases.css";

export function Canvases({
  videoRef,
  vidDetectionRef,
  imgCanvasRef,
  handleCanPlayVideo,
}) {
  return (
    <div className="canvases">
      <div className="video-container">
        <h2>Vidéos en temps Réel</h2>
        <video
          preload="none"
          id="video"
          onCanPlay={handleCanPlayVideo}
          ref={videoRef}
        />
        <canvas id="detection-video-canva" ref={vidDetectionRef}></canvas>
      </div>

      <div className="detection-container">
        <h2>Capture d&apos;image</h2>
        <canvas ref={imgCanvasRef}> </canvas>
      </div>
    </div>
  );
}
