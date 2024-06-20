import "../styles/App.css";
import "../styles/RecordButtonGroup.css";

export function RecordButtonGroup({
  currentDevice,
  isRecording,
  handleClickRecord,
}) {
  return (
    <div className="button-group">
      <button
        className="screen-button start"
        id="screenshot-button"
        onClick={handleClickRecord}
        disabled={currentDevice ? (isRecording ? true : false) : true}
      >
        Start
      </button>
      <button
        className="screen-button stop"
        id="screenshot-button"
        onClick={handleClickRecord}
        disabled={currentDevice ? (isRecording ? false : true) : true}
      >
        Stop
      </button>
    </div>
  );
}
