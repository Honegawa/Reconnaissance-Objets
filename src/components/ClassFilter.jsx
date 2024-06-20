import "../styles/ClassFilter.css";
import { CLASSES } from "../utils/constants/coco-ssd";

export function ClassFilter({ classFilter, handleFilterChange }) {
  return (
    <div className="capture">
      <fieldset>
        <legend>Filtre d&apos;objets</legend>
        <div id="filter-list">
          {CLASSES.sort().map((c) => (
            <div key={c}>
              <input
                type="checkbox"
                id={c}
                name="filter"
                onChange={handleFilterChange}
                checked={classFilter.includes(c)}
              />
              <label htmlFor={c}>{`${c.charAt(0).toUpperCase()}${c.slice(1)}`}</label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
