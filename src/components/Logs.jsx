import { Fragment } from "react";
import "../styles/Logs.css";

export function Logs({logDetections}) {
  return (
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
                    Object.entries(detection.occurences)[0].map((entry) => (
                      <td key={`${detection.timestamp}-${entry}`}>{entry}</td>
                    ))
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
  );
}
