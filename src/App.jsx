import { useState, useEffect, useRef } from "react";

import Db from "./db";

// TensorFlow
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

// CSS
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const imgCanvasRef = useRef(null);
  const vidCanvasRef = useRef(null);
  const buttonRef = useRef(null);
  const width = 1280;
  const height = 720;

  const [userDevices, setUserDevices] = useState([]);
  const [deviceSelect, setDeviceSelect] = useState();
  const [currentDevice, setCurrentDevice] = useState();
  const [model, setModel] = useState(null);
  const [imageURLS, setImageURLS] = useState([]);

  // Charge les cameras de l'utilisateur
  useEffect(() => {
    getUserFlux();
    loadDb();
    loadImages();
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

  const loadDb = async () => {
    await Db.dbInit();
    const gallery = await Db.dbRead();

    loadImages(gallery);
  };

  const loadImages = (gallery) => {
    if (gallery) {
      const imagePromises = gallery.map((element) =>
        new Response(element.image).text()
      );

      Promise.all(imagePromises).then((value) => setImageURLS(value));
    }
  };

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

  const handleClik = (event) => {
    event.target.disabled = true;
    takePicture();
  };

  const handleCanPlayVideo = () => {
    const context = vidCanvasRef.current.getContext("2d");

    detectFromVideoFrame(context, videoRef.current);
  };

  const takePicture = () => {
    const image = new Image();
    const imageToStore = new Image();

    const context = imgCanvasRef.current.getContext("2d");

    imgCanvasRef.current.width = width;
    imgCanvasRef.current.height = height;

    context.drawImage(videoRef.current, 0, 0, width, height);

    const data = imgCanvasRef.current.toDataURL("image/png");
    image.setAttribute("src", data);
    imageToStore.setAttribute("src", data);
    image.addEventListener("load", async () =>
      detectFromImageFrame(context, imgCanvasRef.current)
    );
    imageToStore.addEventListener("load", async () =>
      createStoredImage(
        await model.detect(imageToStore).then((predictions) => predictions)
      )
    );
  };

  const detectFromImageFrame = async (context, image) => {
    await model.detect(image).then((predictions) => {
      showDetections(context, predictions, "image");
      buttonRef.current.disabled = false;
    });
  };

  const detectFromVideoFrame = async (context, video) => {
    await model.detect(video).then((predictions) => {
      vidCanvasRef.current.width = video.videoWidth;
      vidCanvasRef.current.height = video.videoHeight;

      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.drawImage(
        videoRef.current,
        0,
        0,
        video.videoWidth,
        video.videoHeight
      );
      showDetections(context, predictions, "video");

      requestAnimationFrame(() => {
        detectFromVideoFrame(context, video);
      });
    });
  };

  const showDetections = (context, predictions, log) => {
    const color = "red";
    context.font = "bold 36px Arial";

    // console.log(log,"Predictions: ", predictions);
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

  const createStoredImage = (predictions) => {
    const occurences = {};
    predictions.map((prediction) => {
      prediction.class in occurences
        ? (occurences[prediction.class] += 1)
        : (occurences[prediction.class] = 1);
    });

    const dataImage = imgCanvasRef.current.toDataURL();
    const blob = new Blob([dataImage], {
      type: "image/png",
    });
    const date = new Date(Date.now()).toISOString();

    const newImage = { image: blob, timestamp: date, occurences: occurences };
    Db.dbAdd(newImage);

    setImageURLS((prev) => [...prev, dataImage]);
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
              ref={buttonRef}
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
            <h2>Galerie({imageURLS.length !== 0 ? imageURLS.length : 0})</h2>
            <div className="last-screens">
              {imageURLS.map((img, index) => (
                <div key={index} className="image-gallery-container">
                  <img className="gallery-image" src={img} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
