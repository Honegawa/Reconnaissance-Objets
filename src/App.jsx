import { useState, useEffect, useRef, Fragment } from "react";

import Db from "./utils/services/db.jsx";
import { CLASSES } from "./utils/constants/coco-ssd.js";

// TensorFlow
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

// CSS
import "./styles/App.css";
import ToggleButton from "./components/ToggleButton.jsx";
import SendCaptures from "./components/SendCaptures.jsx";
import { RecordButtonGroup } from "./components/RecordButtonGroup.jsx";
import { Gallery } from "./components/Gallery.jsx";

function App() {
  const videoRef = useRef(null);
  const imgCanvasRef = useRef(null);
  const vidDetectionRef = useRef(null);
  const buttonRef = useRef(null);
  const width = 1280;
  const height = 720;

  const interval = useRef();

  const [userDevices, setUserDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState();
  const [model, setModel] = useState(null);
  const [classFilter, setClassFilter] = useState([]);
  const [logDetections, setLogDetections] = useState([]);
  const [imageURLS, setImageURLS] = useState([]);
  const [attachments, setAttachements] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  // Charge les cameras de l'utilisateur
  useEffect(() => {
    getUserFlux();
    loadDb();
    loadImages();
    loadModel();

    return () => clearInterval(interval.current);
  }, []);

  // Start/stop detection when classFilter is changed
  useEffect(() => {
    if (currentDevice) {
      resetDetection();

      initDetection();
    }
  }, [classFilter, isRecording]);

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

      Promise.all(imagePromises).then((value) =>
        setImageURLS(
          detections.map((detection, index) => {
            return { timestamp: detection.timestamp, url: value[index] };
          })
        )
      );
    }
  };

  const loadModel = async () => {
    const model = await cocoSsd.load();
    setModel(model);
  };

  const initDetection = () => {
    interval.current = setInterval(() => {
      detectFromVideo(model);
    }, 1000);
  };

  const resetDetection = () => {
    const context = vidDetectionRef.current.getContext("2d");

    clearInterval(interval.current);
    interval.current = null;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  };

  const handleCamChange = async (event) => {
    resetDetection();

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
    if (currentDevice) {
      event.target.disabled = true;
      takePicture();
    }
  };

  const handleClickRecord = () => {
    setIsRecording(!isRecording);
  };

  const handleClickImage = (event) => {
    const { src, id } = event.target;
    const timestamp = id.slice(4);

    if (attachments.find((a) => a.timestamp === timestamp)) {
      setAttachements(attachments.filter((a) => a.timestamp !== timestamp));
    } else {
      setAttachements((prev) => [...prev, { timestamp: timestamp, url: src }]);
    }
  };

  const handleCanPlayVideo = () => {
    if (currentDevice && !interval.current) {
      initDetection();
    }
  };

  const handleFilterChange = (event) => {
    const { id } = event.target;

    if (classFilter.includes(id)) {
      setClassFilter(classFilter.filter((c) => c !== id));
    } else {
      setClassFilter((prev) => [...prev, id]);
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

      createLog(predictions);
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

        if (isRecording) {
          createLog(predictions);
        }
      });
    }
  };

  const showDetections = (context, predictions) => {
    const color = "red";
    context.font = "bold 36px Arial";

    predictions
      .filter((pred) => !classFilter.includes(pred.class))
      .forEach((pred) => {
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
    const occurences = getOccurences(predictions);

    const dataImage = imgCanvasRef.current.toDataURL();
    const blob = new Blob([dataImage], {
      type: "image/png",
    });
    const date = new Date(Date.now()).toISOString();

    const newImage = { image: blob, timestamp: date, occurences: occurences };
    Db.dbAdd(newImage);

    setImageURLS((prev) => [...prev, { timestamp: date, url: dataImage }]);
  };

  const createLog = (predictions) => {
    const date = new Date(Date.now()).toISOString();

    const occurences = getOccurences(predictions);

    const newDetection = { timestamp: date, occurences: occurences };

    setLogDetections((prev) => [...prev, newDetection]);
  };

  const getOccurences = (predictions) => {
    const occurences = {};
    predictions
      .filter((prediction) => !classFilter.includes(prediction.class))
      .map((prediction) => {
        prediction.class in occurences
          ? (occurences[prediction.class] += 1)
          : (occurences[prediction.class] = 1);
      });
    return occurences;
  };

  return (
    <>
      <header id="header">
        <h1>Reconnaissance objets</h1>
        <ToggleButton />
      </header>

      <main>
        {!model ? (
          <section>
            <h2>Chargement du model en cours...</h2>
          </section>
        ) : (
          <>
            <div className="detection-panel">
              <section className="cam">
                <div className="canvases">
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
                    <h2>Capture d&apos;image</h2>
                    <div>
                      <canvas ref={imgCanvasRef}> </canvas>
                    </div>
                  </div>
                </div>

                <div className="buttons">
                  <button
                    className="screen-button"
                    id="screenshot-button"
                    onClick={handleClick}
                    ref={buttonRef}
                    disabled={!currentDevice}
                  >
                    Capture
                  </button>

                  <RecordButtonGroup
                    currentDevice={currentDevice}
                    handleClickRecord={handleClickRecord}
                    isRecording={isRecording}
                  />
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

                <div className="capture">
                  <fieldset>
                    <legend>Filtre d&apos;objets</legend>
                    <div id="filter-list">
                      {CLASSES.map((c) => (
                        <div key={c}>
                          <input
                            type="checkbox"
                            id={c}
                            name="filter"
                            onChange={handleFilterChange}
                            checked={classFilter.includes(c)}
                          />
                          <label htmlFor={c}>{c}</label>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </section>
            </div>
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
                        <td
                          rowSpan={
                            Object.keys(detection.occurences).length
                              ? Object.keys(detection.occurences).length
                              : 1
                          }
                        >
                          {`${new Date(
                            detection.timestamp
                          ).toLocaleTimeString()} ${new Date(
                            detection.timestamp
                          ).toLocaleDateString()}`}
                        </td>
                        {Object.entries(detection.occurences)[0] ? (
                          Object.entries(detection.occurences)[0].map(
                            (entry) => (
                              <td key={`${detection.timestamp}-${entry}`}>
                                {entry}
                              </td>
                            )
                          )
                        ) : (
                          <>
                            <td></td>
                            <td></td>
                          </>
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
          
          <Gallery
            attachments={attachments}
            imageURLS={imageURLS}
            handleClickImage={handleClickImage}
          />
        </section>

        <section className="mailing">
          <SendCaptures attachments={attachments} />
        </section>
      </main>
    </>
  );
}

export default App;
