import { useState, useEffect } from "react";
// CSS
import "./App.css";

function App() {

  const [userDevices, setUserDevices] = useState([]);
  const [deviceSelect, setDeviceSelect] = useState();
  const [currentDevice, setCurrentDevice] = useState();

  let width = 320;
  let height = 0;
  let streaming = false;
  let video = null;
  let canvas = null;
  let photo = null;
  let startButton = null;

  // Charge les cameras de l'utilisateur
  useEffect(() => {
    getUserFlux();
  },[])

  // Genere les options pour la selection des cameras
  useEffect(() => {
    userDevices.length != 0 && displayDevices();
  }, [userDevices])

  // Charge le flux video en fonction de la camera choisie
  useEffect(() => {
    startup()
  }, [currentDevice])

  const getUserFlux = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setUserDevices(devices.filter((device) => device.kind == "videoinput"));
  }

  const displayDevices = () => (
    setDeviceSelect(userDevices.map((device, index) => (<option key={index} id={device.deviceId}>{device.label}</option>)))
  );

  const startup = async () => {
    video = document.getElementById("video");
    canvas = document.getElementById("video-canvas");
    photo = document.getElementById("detection-canvas");
    startButton = document.getElementById("screenshot-button");
    
   try{ const stream = currentDevice === undefined ?
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    : await  navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: currentDevice } } })
    video.srcObject = stream;
    video.play();
  }catch(e){
    console.log(e.message);
  }
  
  video.addEventListener("canplay", () => {
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth / width);

      // Firefox a un bug où la hauteur ne peut pas être lue
      // à partir de la vidéo. On prend des précautions.

      if (isNaN(height)) {
        height = width / (4 / 3);
      }

      video.setAttribute("width", width);
      video.setAttribute("height", height);
      photo.setAttribute("width", width);
      photo.setAttribute("height", height);
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);
      streaming = true;
    }
  },
  false,
  );
  
  startButton.addEventListener(
    "click",
    (e) => {
      takePicture();
      e.preventDefault();
    },
    false,
  );

  clearPhoto();
  }

  const clearPhoto = () => {
    const context = canvas.getContext("2d");
      context.fillStyle = "#AAA";
      context.fillRect(0, 0, canvas.width, canvas.height);
  
      const data = canvas.toDataURL("image/png");
      photo.setAttribute("src", data);
  }

  const takePicture = () => {
    const context = canvas.getContext("2d");
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      const data = canvas.toDataURL("image/png");
      console.log(data)
      photo.setAttribute("src", data);
    } else {
      clearPhoto();
    }
  }


  return (
    <>
      <header>
        <h1>Reconnaissance objets</h1>
      </header>

      <main>
        <section className="canvases">
          <div className="video-container">
            <h2>Vidéos en temps Réel</h2>
            <video preload='none' id="video" width={720} height={600}>Le flux vidéo n&apos;est pas disponible.</video>
          </div>
          <div className="detection-container">
            <h2>Video : Objets Détectés</h2>
            <canvas id="video-canvas">
              {/* L'apércue actuelle de la caméra ici */}
            </canvas>
          </div>
          <div className="detection-container">
            <h2>Image : Objets Détectés</h2>
            <img id="detection-canvas">{/* La capture ici*/}</img>
          </div>
        </section>

        <section className="controls">
          <div className="choix_camera">
            <label htmlFor="camera-select">Choix de la caméra: </label>
            <select name="camera" id="camera-select" onChange={(e) => setCurrentDevice(userDevices.filter(device => device.label == e.target.value)[0].deviceId)}>
              {deviceSelect}
            </select>
          </div>
        </section>

        <button className="screen-button" id="screenshot-button">
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
