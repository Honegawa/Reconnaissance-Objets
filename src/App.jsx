import React from "react";
import { useState } from "react";
import { useEffect } from "react";
// CSS
import "./App.css";

function App() {
  return (
    <>
      <header>
        <h1>Reconnaissance objets</h1>
      </header>

      <main>
        <section className="canvases">
          <div className="video-container">
            <h2>Vidéos en temps Réel</h2>
            <canvas id="video-canvas">
              {/* L'apércue actuelle de la caméra ici */}
            </canvas>
          </div>
          <div className="detection-container">
            <h2>Objets Détectés</h2>
            <canvas id="detection-canvas">{/* La capture ici*/}</canvas>
          </div>
        </section>

        <section className="controls">
          <div className="choix_camera">
            <label for="camera-select">Choix de la caméra: </label>
            <select id="camera-select">
              {/* <!-- Les caméras   --> */}
              <option value="camera2">
                {/* les oprions ici */}
                {/* les oprions ici */}
                {/* les oprions ici */}
              </option>
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
