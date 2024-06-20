import "../styles/Gallery.css";

export function Gallery({ imageURLS, attachments, handleClickImage }) {
  return (
    <div className="galery">
      <h2>Galerie ({imageURLS.length !== 0 ? imageURLS.length : 0})</h2>
      <div className="last-screens">
        {imageURLS.map((img, index) => (
          <div
            key={index}
            className={`image-gallery-container ${
              attachments.find((a) => a.timestamp === img.timestamp)
                ? "selected"
                : ""
            }`}
          >
            <img
              className="gallery-image"
              id={`img-${img.timestamp}`}
              src={img.url}
              onClick={handleClickImage}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
