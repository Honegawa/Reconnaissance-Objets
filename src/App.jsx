import { useState, useEffect, useRef } from "react";

// TensorFlow
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

// CSS
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const imgCanvasRef = useRef(null);
  const vidCanvasRef = useRef(null);
  const width = 1280;
  const height = 720;

  const [userDevices, setUserDevices] = useState([]);
  const [deviceSelect, setDeviceSelect] = useState();
  const [currentDevice, setCurrentDevice] = useState();
  const [model, setModel] = useState(null);

  // Charge les cameras de l'utilisateur
  useEffect(() => {
    getUserFlux();
    loadModel();
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
              video: {
                deviceId: { exact: currentDevice },
                width: { exact: width },
                height: { exact: height },
              },
            });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (e) {
      alert(e.message);
      console.log(e.message);
    }
  };

  const loadModel = async () => {
    const model = await cocoSsd.load();
    setModel(model);
  };

  const handleClik = () => {
    takePicture();
  };

  const handleCanPlayVideo = () => {
    const context = vidCanvasRef.current.getContext("2d");

    detectFromVideoFrame(context, videoRef.current);
  };

  const takePicture = () => {
    const image = new Image();

    const context = imgCanvasRef.current.getContext("2d");

    imgCanvasRef.current.width = width;
    imgCanvasRef.current.height = height;

    context.drawImage(videoRef.current, 0, 0, width, height);

    const data = imgCanvasRef.current.toDataURL("image/png");
    image.setAttribute("src", data);
    image.addEventListener("load", async () =>
      detectFromImageFrame(context, imgCanvasRef.current)
    );
  };

  const detectFromImageFrame = async (context, image) => {
    await model.detect(image).then((predictions) => {
      showDetections(context, predictions, "image");
    });
  };

  const detectFromVideoFrame = async (context, video) => {
    await model.detect(video).then((predictions) => {
      vidCanvasRef.current.width = video.videoWidth;
      vidCanvasRef.current.height = video.videoHeight;

      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.drawImage(videoRef.current, 0, 0, video.videoWidth, video.videoHeight);
      showDetections(context, predictions, "video");
      
      requestAnimationFrame(() => {
        detectFromVideoFrame(context, video);
      });
    });

  };

  const showDetections = (context, predictions, log) => {
    const color = "red";
    context.font = "bold 36px Arial";

    console.log(log,"Predictions: ", predictions);

    predictions.forEach((pred) => {
      context.beginPath();
      context.rect(...pred.bbox);
      context.lineWidth = 6;
      context.strokeStyle = color;
      context.fillStyle = color;
      context.stroke();
      context.fillText(
        `${pred.score.toFixed(3)} ${pred.class}`,
        pred.bbox[0] + 20,
        pred.bbox[1] + 36
      );
    });
  };

  return (
    <>
      <header>
        <h1>Reconnaissance objets</h1>
      </header>

      <main>
        {!model ? (
          <section>
            <h2>Chargement du model en cours...</h2>
          </section>
        ) : (
          <>
            <section className="canvases">
              <div className="video-container">
                <h2>Vidéos en temps Réel</h2>
                <video
                  preload="none"
                  id="video"
                  onCanPlay={handleCanPlayVideo}
                  ref={videoRef}
                >
                  Le flux vidéo n&apos;est pas disponible.
                </video>
              </div>
              <div className="detection-container">
                <h2>Video : Objets Détectés</h2>
                <canvas ref={vidCanvasRef}> </canvas>
              </div>
              <div className="detection-container">
                <h2>Image : Objets Détectés</h2>
                <div>
                  <canvas ref={imgCanvasRef}> </canvas>
                </div>
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
          </>
        )}

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
