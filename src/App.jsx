import { useState, useEffect, useRef, Fragment } from "react";

import Db from "./db";

// TensorFlow
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

// CSS
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const imgCanvasRef = useRef(null);
  const vidDetectionRef = useRef(null);
  const buttonRef = useRef(null);
  const width = 1280;
  const height = 720;

  let interval;

  const [userDevices, setUserDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState();
  const [model, setModel] = useState(null);
  const [logDetections, setLogDetections] = useState([]);
  const [imageURLS, setImageURLS] = useState([]);

  // Charge les cameras de l'utilisateur
  useEffect(() => {
    getUserFlux();
    loadDb();
    loadImages();
    loadModel();
  }, []);

  const getUserFlux = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setUserDevices(devices.filter((device) => device.kind == "videoinput"));
  };

  const loadDb = async () => {
    await Db.dbInit();
    const detections = await Db.dbRead();

    loadImages(detections);
  };

  const loadImages = (detections) => {
    if (detections) {
      const imagePromises = detections.map((element) =>
        new Response(element.image).text()
      );

      Promise.all(imagePromises).then((value) => setImageURLS(value));
    }
  };

  const loadModel = async () => {
    const model = await cocoSsd.load();
    setModel(model);
  };

  const handleCamChange = async (event) => {
    if (interval) {
      clearInterval(interval);
    }

    try {
      let stream;
      // Set default device on first cam load
      if (!currentDevice) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        const id = userDevices.find(
          (device) => device.label === stream.getVideoTracks()[0].label
        ).deviceId;
        event.target.value = id;
        setCurrentDevice(id);
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: event.target.value },
          },
        });

        setCurrentDevice(event.target.value);
      }
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (e) {
      console.log(e);

      if (e.message) {
        // Handle cam device not supported
        alert(e.message, event.target.value);
        event.target.options[event.target.selectedIndex].disabled = true;
      } else {
        // Handle failed loading cam
        if (currentDevice) {
          alert("Le chargement de la caméra n'a aboutie. Veuillez réessayer.");
        }
      }
      event.target.value = currentDevice;
    }
  };

  const handleClick = (event) => {
    event.target.disabled = true;
    takePicture();
  };

  const handleCanPlayVideo = () => {
    if (currentDevice && !interval) {
      interval = setInterval(() => {
        detectFromVideo(model);
      }, 1000);
    }
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

      const date = new Date(Date.now()).toISOString();

      const occurences = {};
      predictions.map((prediction) => {
        prediction.class in occurences
          ? (occurences[prediction.class] += 1)
          : (occurences[prediction.class] = 1);
      });

      const newDetection = { timestamp: date, occurences: occurences };

      setLogDetections((prev) => [...prev, newDetection]);
    });
  };

  const detectFromVideo = async (model) => {
    const context = vidDetectionRef.current.getContext("2d");
    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (currentDevice && videoWidth && videoHeight) {
      await model.detect(video).then((predictions) => {
        vidDetectionRef.current.width = videoWidth;
        vidDetectionRef.current.height = videoHeight;

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        showDetections(context, predictions);
      });
    }
  };

  const showDetections = (context, predictions) => {
    const color = "red";
    context.font = "bold 36px Arial";

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
                />
                <canvas
                  id="detection-video-canva"
                  ref={vidDetectionRef}
                ></canvas>
              </div>
              <div className="detection-container">
                <h2>Détection de la capture d&apos;image</h2>
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
                  onChange={handleCamChange}
                >
                  <option value="" hidden>
                    Selectionner une caméra
                  </option>
                  {userDevices.map((device, index) => (
                    <option
                      key={index}
                      id={device.deviceId}
                      value={device.deviceId}
                    >
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <button
              className="screen-button"
              id="screenshot-button"
              onClick={handleClick}
              ref={buttonRef}
            >
              Capture
            </button>
          </>
        )}

        <section className="log-galerie">
          <div className="log">
            <h2>Logs des Captures</h2>
            <div id="log-console">
              <table>
                <thead>
                  <tr>
                    <th id="table-date">Date</th>
                    <th>Objet</th>
                    <th id="table-occurence">Occurences</th>
                  </tr>
                </thead>
                <tbody>
                  {logDetections.map((detection) => (
                    <Fragment key={detection.timestamp}>
                      <tr>
                        <td rowSpan={Object.keys(detection.occurences).length}>
                          {`${new Date(
                            detection.timestamp
                          ).toLocaleTimeString()} ${new Date(
                            detection.timestamp
                          ).toLocaleDateString()}`}
                        </td>
                        {Object.entries(detection.occurences)[0].map(
                          (entry) => (
                            <td key={`${detection.timestamp}-${entry}`}>
                              {entry}
                            </td>
                          )
                        )}
                      </tr>
                      {Object.entries(detection.occurences).length > 1 &&
                        Object.entries(detection.occurences)
                          .slice(1)
                          .map((entry) => (
                            <tr key={`${detection.timestamp}-${entry[0]}`}>
                              <td>{entry[0]}</td>
                              <td>{entry[1]}</td>
                            </tr>
                          ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="galery">
            <h2>Galerie ({imageURLS.length !== 0 ? imageURLS.length : 0})</h2>
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
