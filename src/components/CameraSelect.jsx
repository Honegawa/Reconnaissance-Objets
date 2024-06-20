export function CameraSelect({ userDevices, handleCamChange }) {
  return (
    <div className="choix_camera">
      <label htmlFor="camera-select">Choix de la caméra: </label>
      <select name="camera" id="camera-select" onChange={handleCamChange}>
        <option value="" hidden>
          Selectionner une caméra
        </option>
        {userDevices.map((device, index) => (
          <option key={index} id={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
}
