function Db() {
  const dbName = "object_recognition";
  const tableName = "images";

  const dbInit = () => {
    const request = window.indexedDB.open(dbName);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      const objectStore = db.createObjectStore(tableName, {
        keyPath: "id",
        autoIncrement: true,
      });
      objectStore.createIndex("image", "image", { unique: true });
    };
    request.onsuccess = () => {
      console.log("The database has been initialized");
    };
    request.onerror = (e) => {
      console.log("There has been an error the database", e);
    };
  };

  const dbAdd = (data) => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbName);

      request.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction([tableName], "readwrite");
        const objectStore = transaction.objectStore("images");
        const request = objectStore.add(data);

        request.onsuccess = () => {
          console.log("Data added successfully");
          resolve(data);
        };
        transaction.oncomplete = () => {
          db.close();
        };
      };
      request.onerror = (e) => {
        console.log("Error adding data", e);
        if (e.message) {
          reject(e.message);
        } else {
          reject("Unknow error");
        }
      };
    });
  };

  const dbRead = () => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbName);
      request.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction([tableName], "readonly");
        const objectStore = transaction.objectStore(tableName);
        const request = objectStore.getAll();

        request.onsuccess = () => {
          console.log("Data retrieved successfully", request.result);
          resolve(request.result);
        };
        transaction.oncomplete = () => {
          db.close();
        };
      };
      request.onerror = (e) => {
        console.log("Error retrieving data", e);
        reject(e.message);
      };
    });
  };

  const dbUpdate = (data, id) => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbName);

      request.onsuccess = (e) => {
        const db = e.target.result;

        const transaction = db.transaction([tableName], "readwrite");
        const objectStore = transaction.objectStore(tableName);
        const request = objectStore.get(id);
        request.onsuccess = () => {
          const newData = { ...request.result, ...data };
          objectStore.put(newData);
          console.log("Data updated successfully");
          resolve(newData);
        };
        transaction.oncomplete = () => {
          db.close();
        };
      };
      request.onerror = (e) => {
        console.log("Error updating data", e);
        reject(e.message);
      };
    });
  };

  const dbDelete = (id) => {
    return new Promise((resolve) => {
      const request = window.indexedDB.open(dbName);

      request.onsuccess = (e) => {
        const db = e.target.result;

        const transaction = db.transaction(tableName, "readwrite");
        const objectStore = transaction.objectStore(tableName);
        const request = objectStore.delete(id);
        request.onsuccess = () => {
          console.log("Data deleted successfully");
          resolve(true);
        };
        transaction.oncomplete = () => {
          db.close();
        };
      };
      request.onerror = (e) => {
        console.log("Error deleting data", e);
        resolve(false);
      };
    });
  };

  return {
    dbInit,
    dbAdd,
    dbRead,
    dbUpdate,
    dbDelete,
  };
}

export default Db();
