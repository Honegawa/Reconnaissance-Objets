import { useState, useEffect, useRef } from "react";
// CSS
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photoRef = useRef(null);

  const [userDevices, setUserDevices] = useState([]);
  const [deviceSelect, setDeviceSelect] = useState();
  const [currentDevice, setCurrentDevice] = useState();
  const [streaming, setStreaming] = useState(false);

  let width = 320;
  let height = 0;

  // Charge les cameras de l'utilisateur
  useEffect(() => {
    getUserFlux();
  }, []);

  // Genere les options pour la selection des cameras
  useEffect(() => {
    userDevices.length != 0 && displayDevices();
  }, [userDevices]);

  // Charge le flux video en fonction de la camera choisie
  useEffect(() => {
    startup();
  }, [currentDevice]);

  const getUserFlux = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setUserDevices(devices.filter((device) => device.kind == "videoinput"));
  };

  const displayDevices = () =>
    setDeviceSelect(
      userDevices.map((device, index) => (
        <option key={index} id={device.deviceId}>
          {device.label}
        </option>
      ))
    );

  const startup = async () => {
    try {
      const stream =
        currentDevice === undefined
          ? await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            })
          : await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: currentDevice } },
            });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (e) {
      console.log(e.message);
    }

    clearPhoto();
  };

  const handleCanPlay = () => {
    if (!streaming) {
      height = videoRef.current.videoHeight / (videoRef.current.videoWidth / width);

      // Firefox a un bug où la hauteur ne peut pas être lue
      // à partir de la vidéo. On prend des précautions.

      if (isNaN(height)) {
        height = width / (4 / 3);
      }

      videoRef.current.setAttribute("width", width);
      videoRef.current.setAttribute("height", height);
      photoRef.current.setAttribute("width", width);
      photoRef.current.setAttribute("height", height);
      canvasRef.current.setAttribute("width", width);
      canvasRef.current.setAttribute("height", height);
      setStreaming(true);
    }
  }

  const handleClik = () => {
    takePicture();
  };

  const clearPhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const data = canvasRef.current.toDataURL("image/png");
    photoRef.current.setAttribute("src", data);
  };

  const takePicture = () => {
    const context = canvasRef.current.getContext("2d");
    if (width && height) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      context.drawImage(videoRef.current, 0, 0, width, height);

      const data = canvasRef.current.toDataURL("image/png");
      console.log(data);
      photoRef.current.setAttribute("src", data);
    } else {
      clearPhoto();
    }
  };

  return (
    <>
      <header>
        <h1>Reconnaissance objets</h1>
      </header>

      <main>
        <section className="canvases">
          <div className="video-container">
            <h2>Vidéos en temps Réel</h2>
            <video preload="none" id="video" onCanPlay={handleCanPlay} ref={videoRef}>
              Le flux vidéo n&apos;est pas disponible.
            </video>
          </div>
          <div className="detection-container">
            <h2>Video : Objets Détectés</h2>
            <canvas id="video-canvas" ref={canvasRef}>
              {/* L'apércue actuelle de la caméra ici */}
            </canvas>
          </div>
          <div className="detection-container">
            <h2>Image : Objets Détectés</h2>
            <img id="detection-canvas" ref={photoRef}>{/* La capture ici*/}</img>
          </div>
        </section>

        <section className="controls">
          <div className="choix_camera">
            <label htmlFor="camera-select">Choix de la caméra: </label>
            <select
              name="camera"
              id="camera-select"
              onChange={(e) =>
                setCurrentDevice(
                  userDevices.filter(
                    (device) => device.label == e.target.value
                  )[0].deviceId
                )
              }
            >
              {deviceSelect}
            </select>
          </div>
        </section>

        <button
          className="screen-button"
          id="screenshot-button"
          onClick={handleClik}
        >
          Captures
        </button>

        <section className="log-galerie">
          <div className="log">
            <h2>Log des Captures</h2>
            <div id="log-console">{/* <!-- Les  Loggg  --> */}</div>
          </div>
          <div className="galery">
            <h2>Galerie</h2>
            <div className="last-screens">{/* Les dérniers élements  */}</div>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
